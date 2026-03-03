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
            fetchPromise = fetch('/data/scrapedCards.json')
                .then(res => res.json())
                .then(data => {
                    globalCardCache = data;
                    setCards(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching scrapedCards.json:', err);
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
     * Case-insensitive, ignores extra spaces.
     */
    const getCardImage = (cardName: string): string | null => {
        if (!cardName || !globalCardCache) return null;

        // Normalize to lowercase for reliable lookups
        const normalized = cardName.toLowerCase().trim();
        const cardData = globalCardCache[normalized];

        return cardData?.image || null;
    };

    /**
     * Looks up a card by name and returns its description/rawtext if requested
     */
    const getCardData = (cardName: string) => {
        if (!cardName || !globalCardCache) return null;
        const normalized = cardName.toLowerCase().trim();
        return globalCardCache[normalized] || null;
    };

    return { getCardImage, getCardData, loading };
}
