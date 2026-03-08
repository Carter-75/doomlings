import { useState, useEffect } from 'react';

// The hook maintains a global cache so we only fetch the JSON once
let globalCardCache: Record<string, any> | null = null;
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

export function useCardImage() {
    const [cards, setCards] = useState<Record<string, any>>(globalCardCache || {});
    const [loading, setLoading] = useState(!globalCardCache);

    useEffect(() => {
        if (globalCardCache) {
            setLoading(false);
            return;
        }

        if (!isFetching) {
            isFetching = true;
            fetchPromise = Promise.all([
                fetch('/data/scrapedCards.json').then(res => {
                    if (!res.ok) throw new Error(`scrapedCards.json fetch failed: ${res.status} ${res.statusText}`);
                    return res.json();
                }),
                fetch('/data/missingCardsFoundFromScrape.json').then(res => {
                    // This file is optional — swallow all failures gracefully
                    if (!res.ok) return [];
                    return res.json().catch(() => []);
                }).catch(() => []) // Also catch network-level errors for the optional file
            ])
                .then(([scrapedData, missingData]) => {
                    const combined = { ...scrapedData };

                    // Add any missing cards that were manually aggregated
                    if (Array.isArray(missingData)) {
                        missingData.forEach((card: any) => {
                            if (card && card.name) {
                                // strictly normalize the key
                                const key = card.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                combined[key] = card;
                            }
                        });
                    }

                    // Also duplicate existing keys in the cache to have a stripped-down alphanumeric key
                    const finalizedCache: Record<string, any> = {};
                    Object.keys(combined).forEach(originalKey => {
                        const cleanKey = originalKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                        finalizedCache[cleanKey] = combined[originalKey];
                    });

                    globalCardCache = finalizedCache;
                    setCards(finalizedCache);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching card data:', err);
                    setLoading(false);
                })
                .finally(() => {
                    isFetching = false;
                });
        } else if (fetchPromise) {
            // If already fetching, wait for it to finish
            fetchPromise.then(() => {
                if (globalCardCache) {
                    setCards(globalCardCache);
                    setLoading(false);
                }
            });
        }
    }, []);

    /**
     * Looks up a card by name and returns its image URL.
     * Uses strict alphanumeric matching to ignore whitespace and punctuation differences.
     */
    const getCardImage = (cardName: string): string | null => {
        if (!cardName || !globalCardCache) return null;

        const normalized = cardName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cardData = globalCardCache[normalized];

        return cardData?.image || null;
    };

    /**
     * Looks up a card by name and returns its description/rawtext if requested
     */
    const getCardData = (cardName: string) => {
        if (!cardName || !globalCardCache) return null;

        const normalized = cardName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return globalCardCache[normalized] || null;
    };

    return { getCardImage, getCardData, loading };
}
