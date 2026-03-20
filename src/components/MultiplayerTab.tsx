import React, { useState, useEffect } from 'react';
import GameSocketManager from '@/lib/gameSocketManager';
import AnimatedButton from './AnimatedButton';

interface MultiplayerTabProps {
    playerNames: string[];
    playerCount: number;
}

export default function MultiplayerTab({ playerNames, playerCount }: MultiplayerTabProps) {
    const [socketManager] = useState(() => GameSocketManager.getInstance());
    const [localRooms, setLocalRooms] = useState<any[]>([]);
    const [currentRoom, setCurrentRoom] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    // New state for room creation
    const [roomName, setRoomName] = useState('');
    const [roomPassword, setRoomPassword] = useState('');

    // Use the primary player's name as the host name
    const hostName = playerNames[0] || 'Player 1';

    useEffect(() => {
        loadLocalRooms();

        socketManager.onRoomJoined((room: any) => {
            setCurrentRoom(room);
            setIsConnecting(false);
            setError('');
        });

        socketManager.onError((errorMsg: string) => {
            setError(errorMsg);
            setIsConnecting(false);
        });

        socketManager.onRoomListUpdated(() => {
            loadLocalRooms();
        });

        return () => {
            // Cleanup handled by manager
        };
    }, []);

    const loadLocalRooms = async () => {
        try {
            if ('getLocalRooms' in socketManager) {
                const rooms = await (socketManager as any).getLocalRooms();
                setLocalRooms(rooms);
            }
        } catch (err) {
            console.error('Failed to load local rooms:', err);
        }
    };

    const handleCreateRoom = async () => {
        setIsConnecting(true);
        setError('');
        try {
            const roomSettings = {
                roomName: roomName.trim() || `${hostName}'s Sync Room`,
                password: roomPassword.trim() || undefined,
                maxPlayers: 6,
                isPrivate: true, // It's private from the global public list
                isLocal: true
            };

            await socketManager.registerPlayer(hostName);
            const res = await socketManager.createRoom(roomSettings);
            if (res && res.room) setCurrentRoom(res.room);
            setIsConnecting(false);
        } catch (err) {
            setError(err.message || 'Failed to create local room');
            setIsConnecting(false);
        }
    };

    const handleJoinRoom = async (roomId: string, requiresPassword?: boolean) => {
        let passwordToUse = undefined;

        if (requiresPassword) {
            const userInput = window.prompt("This room requires a password:");
            if (userInput === null) return; // User cancelled
            passwordToUse = userInput;
        }

        setIsConnecting(true);
        setError('');
        try {
            await socketManager.registerPlayer(hostName);
            await socketManager.joinRoom(roomId, passwordToUse);
        } catch (err: any) {
            setError(err.message || 'Failed to join local room');
            setIsConnecting(false);
        }
    };

    const handleLeaveRoom = () => {
        socketManager.leaveRoom();
        setCurrentRoom(null);
    };

    // If connected to a room, show the sync status
    if (currentRoom) {
        const isHost = currentRoom.hostId === socketManager.getPlayerId();

        return (
            <div className="section">
                <div className="box" style={{ border: '2px solid #581c87', boxShadow: '0 4px 15px rgba(88, 28, 135, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
                        <h2 className="title is-4" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>📡</span> Local Sync Active
                        </h2>
                        <AnimatedButton onClick={handleLeaveRoom} className="is-danger is-small">
                            {isHost ? 'Stop Hosting' : 'Disconnect'}
                        </AnimatedButton>
                    </div>

                    <div className="content">
                        <div className="box mb-3" style={{ background: 'rgba(0,0,0,0.02)' }}>
                            <p className="heading">Room Host</p>
                            <p className="title is-5 mb-1">{isHost ? '👑 You' : currentRoom.name}</p>
                            {currentRoom.password && (
                                <p className="help is-danger">🔒 Password Protected</p>
                            )}
                        </div>

                        <div className="box mb-3" style={{ background: 'rgba(0,0,0,0.02)' }}>
                            <p className="heading">Connected Devices ({currentRoom.players.length})</p>
                            <ul>
                                {currentRoom.players.map((p: any) => (
                                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                        <span>
                                            <span style={{ color: '#581c87', fontWeight: 'bold' }}>•</span> {p.name} {p.id === socketManager.getPlayerId() && '(You)'}
                                        </span>
                                        {p.id === currentRoom.hostId && (
                                            <span className="tag is-primary is-light">Host</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="notification is-info is-light mt-4">
                            ✓ Your game actions (Age Deck, Scores, Challenges) are automatically syncing with these devices.
                            {!isHost && (
                                <p className="help mt-2" style={{ fontStyle: 'italic' }}>
                                    Note: Sync data is only saved on the Host's device to prevent overwriting your own local game saves.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not connected - show room browser
    return (
        <div className="section pt-2">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>🌐</span> Local WiFi Sync
            </h2>
            <p className="subtitle is-6 mb-5 has-text-centered">
                Connect with other devices on your WiFi network to automatically sync Age progressions, Trinket assignments, and Challenges.
            </p>

            {error && (
                <div className="notification is-danger is-light">
                    ⚠️ {error}
                </div>
            )}

            <div className="box mb-5">
                <h3 className="title is-5">Host A New Session</h3>
                <div className="field">
                    <label className="label">Room Name (Optional)</label>
                    <div className="control">
                        <input
                            className="input"
                            type="text"
                            placeholder={`${hostName}'s Sync Room`}
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="field mb-4">
                    <label className="label">Password (Optional)</label>
                    <div className="control">
                        <input
                            className="input"
                            type="text"
                            placeholder="Leave blank for open room"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                        />
                    </div>
                </div>

                <AnimatedButton
                    onClick={handleCreateRoom}
                    disabled={isConnecting}
                    className="is-primary is-fullwidth"
                >
                    {isConnecting ? 'Starting Sync...' : '📡 Start Hosting'}
                </AnimatedButton>
            </div>

            <div className="box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <h3 className="title is-5 m-0">Available Devices</h3>
                    <button onClick={loadLocalRooms} disabled={isConnecting} className="button is-small is-ghost" style={{ padding: 0 }}>
                        🔄 Scan Again
                    </button>
                </div>

                {localRooms.length === 0 ? (
                    <div className="notification is-light has-text-centered py-5">
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
                        <p className="has-text-weight-bold">No host devices found.</p>
                        <p className="is-size-7 mt-2">Make sure you are on the same WiFi as the host.</p>
                    </div>
                ) : (
                    <div>
                        {localRooms.map(room => (
                            <div key={room.id} className="box" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <h4 className="title is-6 m-0 mr-2">{room.name}</h4>
                                        {room.password && <span className="tag is-danger is-light">🔒</span>}
                                    </div>
                                    <p className="is-size-7 mt-1">
                                        {room.currentPlayers} Device{room.currentPlayers !== 1 ? 's' : ''} Connected
                                    </p>
                                </div>
                                <AnimatedButton
                                    onClick={() => handleJoinRoom(room.id, !!room.password)}
                                    disabled={isConnecting}
                                    className="is-info is-small"
                                >
                                    Connect
                                </AnimatedButton>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
