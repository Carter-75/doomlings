import React, { useState, useEffect } from 'react';
import GameSocketManager from '@/lib/gameSocketManager';

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
            // Don't remove listeners to persist connection across re-renders
            // But we might need to handle cleanup if component unmounts entirely
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
            await socketManager.createRoom(roomSettings);
        } catch (err) {
            setError('Failed to create local room');
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
            <div className="card border-2 border-emerald-500 bg-gradient-to-br from-teal-900/30 to-emerald-900/30">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <span className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm mr-3 animate-pulse">
                            📡
                        </span>
                        Local Sync Active
                    </h2>
                    <button
                        onClick={handleLeaveRoom}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm font-bold bg-white/5 px-3 py-1 rounded-lg"
                    >
                        Disconnect
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-black/20 rounded-xl p-4">
                        <div className="text-gray-400 text-sm mb-1">Room Host</div>
                        <div className="text-white font-bold flex items-center text-lg">
                            {isHost ? '👑 You' : currentRoom.name}
                        </div>
                        {currentRoom.password && isHost && (
                            <div className="text-emerald-400 text-xs mt-1">🔒 Password Protected: {currentRoom.password}</div>
                        )}
                        {currentRoom.password && !isHost && (
                            <div className="text-emerald-400 text-xs mt-1">🔒 Password Protected</div>
                        )}
                    </div>

                    <div className="bg-black/20 rounded-xl p-4">
                        <div className="text-gray-400 text-sm mb-2">Connected Devices ({currentRoom.players.length})</div>
                        <div className="space-y-2">
                            {currentRoom.players.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between text-white text-sm bg-white/5 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                                        {p.name} {p.id === socketManager.getPlayerId() && '(You)'}
                                    </div>
                                    {p.id === currentRoom.hostId && (
                                        <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded">Host</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-emerald-300 text-sm mt-4 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                        ✓ Your game actions (Age Deck, Scores, Challenges) will now automatically sync with these devices.
                        {!isHost && (
                            <div className="mt-2 text-xs text-emerald-400/80 italic">
                                Note: Sync data is only saved on the Host's device to prevent overriding your own local games.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Not connected - show room browser
    return (
        <div className="space-y-6">
            <div className="card">
                <h2 className="text-xl font-bold mb-2 flex items-center text-white">
                    <span className="mr-2">🌐</span> Local WiFi Sync
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                    Connect with other devices on your WiFi network to automatically sync Age progressions, Trinket assignments, and Challenge rolls.
                </p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* Create Room Section */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/10 mb-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Host A New Session</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Room Name (Optional)</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                                placeholder={`${hostName}'s Sync Room`}
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Password (Optional)</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                                placeholder="Leave blank for open room"
                                value={roomPassword}
                                onChange={(e) => setRoomPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCreateRoom}
                        disabled={isConnecting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg mt-2"
                    >
                        {isConnecting ? 'Starting Sync...' : '📡 Start Hosting'}
                    </button>
                </div>

                {/* Local Rooms List */}
                <div className="mt-6">
                    <div className="flex justify-between items-end mb-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Available Devices on WiFi</h3>
                        <button
                            onClick={loadLocalRooms}
                            disabled={isConnecting}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center bg-emerald-900/30 px-2 py-1 rounded"
                        >
                            🔄 Scan Again
                        </button>
                    </div>

                    {localRooms.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
                            <div className="text-2xl mb-2">🔍</div>
                            <p className="text-gray-400 text-sm">No host devices found.</p>
                            <p className="text-gray-500 text-xs mt-1">Make sure you are on the same WiFi as the host.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {localRooms.map(room => (
                                <div key={room.id} className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 p-3 flex justify-between items-center transition-all hover:border-emerald-500/50">
                                    <div>
                                        <div className="flex items-center">
                                            <div className="text-white font-bold mr-2">{room.name}</div>
                                            {room.password && <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded flex items-center">🔒</span>}
                                        </div>
                                        <div className="text-emerald-400 text-xs mt-1">
                                            {room.currentPlayers} Device{room.currentPlayers !== 1 ? 's' : ''} Connected
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleJoinRoom(room.id, !!room.password)}
                                        disabled={isConnecting}
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                                    >
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
