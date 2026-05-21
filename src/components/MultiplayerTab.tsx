import React, { useState, useEffect } from 'react';
import GameSocketManager from '@/lib/gameSocketManager';
import AnimatedButton from './AnimatedButton';
import Modal from './Modal';

interface MultiplayerTabProps {
    playerNames: string[];
    playerCount: number;
}

export default function MultiplayerTab({ playerNames, playerCount }: MultiplayerTabProps) {
    const [socketManager] = useState(() => GameSocketManager.getInstance());
    const [localRooms, setLocalRooms] = useState<any[]>([]);
    const [currentRoom, setCurrentRoom] = useState<any>(() => socketManager.getCurrentRoom());
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    // New state for room creation
    const [roomName, setRoomName] = useState('');
    const [roomPassword, setRoomPassword] = useState('');
    
    // New state for joining password
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingJoinRoomId, setPendingJoinRoomId] = useState<string | null>(null);
    const [joinPassword, setJoinPassword] = useState('');

    // Use the primary player's name as the host name
    const hostName = playerNames[0] || 'Player 1';

    useEffect(() => {
        // Ensure connection before loading rooms, as user might have skipped initial setup
        socketManager.connect().then(() => {
            loadLocalRooms();
        }).catch(err => {
            console.error('Socket connection error in MultiplayerTab:', err);
            setError('Failed to connect to multiplayer server.');
        });

        const handleRoomJoined = (room: any) => {
            setCurrentRoom(room);
            setIsConnecting(false);
            setError('');
        };

        const handleRoomUpdated = (room: any) => {
            setCurrentRoom(room);
        };

        const handleRoomLeft = () => {
            setCurrentRoom(null);
        };

        const handleError = (errorMsg: string) => {
            setError(errorMsg);
            setIsConnecting(false);
        };

        const handleRoomListUpdated = () => {
            loadLocalRooms();
        };

        socketManager.onRoomJoined(handleRoomJoined);
        socketManager.onRoomUpdated(handleRoomUpdated);
        socketManager.onRoomLeft(handleRoomLeft);
        socketManager.onError(handleError);
        socketManager.onRoomListUpdated(handleRoomListUpdated);

        return () => {
            socketManager.off('room-joined', handleRoomJoined);
            socketManager.off('room-updated', handleRoomUpdated);
            socketManager.off('room-left', handleRoomLeft);
            socketManager.off('error', handleError);
            socketManager.off('room-list-updated', handleRoomListUpdated);
        };
    }, [socketManager]);

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
            await socketManager.connect();
            
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
        } catch (err: any) {
            console.error('Create room error:', err);
            setError(err.message || (typeof err === 'string' ? err : 'Failed to create local room'));
            setIsConnecting(false);
        }
    };

    const handleJoinRoom = async (roomId: string, requiresPassword?: boolean) => {
        if (requiresPassword) {
            setPendingJoinRoomId(roomId);
            setShowPasswordModal(true);
            setJoinPassword('');
            return;
        }

        executeJoinRoom(roomId);
    };

    const executeJoinRoom = async (roomId: string, password?: string) => {
        setIsConnecting(true);
        setError('');
        try {
            await socketManager.connect();
            
            await socketManager.registerPlayer(hostName);
            await socketManager.joinRoom(roomId, password);
            setShowPasswordModal(false);
        } catch (err: any) {
            console.error('Join room error:', err);
            setError(err.message || (typeof err === 'string' ? err : 'Failed to join local room'));
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
            <div className="section animate-fade-in">
                <div className="box glass p-6 border-1 border-info/30 shadow-xl overflow-hidden relative" style={{ minHeight: '400px' }}>
                    <div className="is-flex is-justify-content-between is-align-items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="title is-4 m-0 is-flex is-align-items-center text-info">
                            <span className="mr-3 animate-pulse">📡</span> Local Sync Active
                        </h2>
                        <AnimatedButton onClick={handleLeaveRoom} className="is-danger is-outlined is-small px-4 font-bold">
                            {isHost ? '🛑 Stop Hosting' : '🔌 Disconnect'}
                        </AnimatedButton>
                    </div>

                    <div className="columns is-multiline">
                        <div className="column is-12-mobile is-5-tablet">
                            <div className="box glass-light p-5 h-full border-white/5">
                                <p className="text-muted is-size-7 uppercase letter-spacing-1 mb-2">Room Host</p>
                                <p className="title is-4 mb-2">{isHost ? '👑 You' : currentRoom.name}</p>
                                {currentRoom.password && (
                                    <span className="tag is-danger is-light is-rounded px-3">🔒 Secured Session</span>
                                )}
                                <div className="mt-6 pt-4 border-t border-white/5">
                                    <div className="notification is-info is-light py-3 px-4 shadow-inner">
                                        <p className="is-size-7">✓ Actions like <strong>Age Flipping</strong> and <strong>Challenges</strong> are now syncing in real-time.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="column is-12-mobile is-7-tablet">
                            <div className="box glass-light p-5 h-full border-white/5">
                                <p className="text-muted is-size-7 uppercase letter-spacing-1 mb-4">Connected Devices ({currentRoom.players.length})</p>
                                <div className="devices-list">
                                    {currentRoom.players.map((p: any) => (
                                        <div key={p.id} className="device-item is-flex is-justify-content-between is-align-items-center mb-3 p-3 rounded-lg border-1 border-white/5 hover:bg-white/5 transition-all">
                                            <div className="is-flex is-align-items-center">
                                                <div className={`status-dot mr-3 ${p.id === currentRoom.hostId ? 'bg-primary' : 'bg-success'}`} style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
                                                <span className="font-bold">{p.name} {p.id === socketManager.getPlayerId() && <span className="text-muted font-normal ml-1">(You)</span>}</span>
                                            </div>
                                            {p.id === currentRoom.hostId && (
                                                <span className="tag is-primary is-small font-black">HOST</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not connected - show room browser
    return (
        <div className="section pt-2 animate-fade-in">
            <h2 className="section-title is-flex is-align-items-center">
                <span className="mr-3">🌐</span> Local WiFi Sync
            </h2>
            <p className="subtitle is-6 mb-8 has-text-centered text-muted italic">
                Connect multiple devices on your WiFi to sync Age progression and Challenges.
            </p>

            {error && (
                <div className="notification is-danger is-light mb-6 shadow-md animate-bounce">
                    ⚠️ {error}
                </div>
            )}

            <div className="columns is-multiline">
                <div className="column is-12-tablet is-5-desktop">
                    <div className="box glass p-6 border-1 border-white/10 h-full shadow-lg">
                        <h3 className="title is-5 mb-6 text-secondary border-b border-white/10 pb-3">📡 Host A Session</h3>
                        
                        <div className="field mb-4">
                            <label className="label text-muted is-size-7">Room Name</label>
                            <div className="control">
                                <input
                                    className="input premium-input"
                                    type="text"
                                    placeholder={`${hostName}'s Room`}
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="field mb-6">
                            <label className="label text-muted is-size-7">Password (Optional)</label>
                            <div className="control">
                                <input
                                    className="input premium-input"
                                    type="password"
                                    placeholder="Keep empty for public"
                                    value={roomPassword}
                                    onChange={(e) => setRoomPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <AnimatedButton
                            onClick={handleCreateRoom}
                            disabled={isConnecting}
                            className="is-primary is-fullwidth button-premium py-4"
                        >
                            {isConnecting ? 'Starting...' : '✨ Create Sync Room'}
                        </AnimatedButton>
                    </div>
                </div>

                <div className="column is-12-tablet is-7-desktop">
                    <div className="box glass p-6 border-1 border-white/10 h-full shadow-lg">
                        <div className="is-flex is-justify-content-between is-align-items-center mb-6 border-b border-white/10 pb-3">
                            <h3 className="title is-5 m-0 text-secondary">📱 Nearby Devices</h3>
                            <button onClick={loadLocalRooms} disabled={isConnecting} className="button is-small is-primary is-text is-ghost px-2">
                                🔄 Refresh
                            </button>
                        </div>

                        {localRooms.length === 0 ? (
                            <div className="has-text-centered py-12 px-6 rounded-xl glass-light border-dashed border-2 border-white/5 opacity-50">
                                <div className="is-size-2 mb-4">🔍</div>
                                <p className="font-bold mb-1">Scanning for hosts...</p>
                                <p className="is-size-7">Ensure other devices are on the same WiFi.</p>
                            </div>
                        ) : (
                            <div className="available-rooms-list pr-1" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {localRooms.map(room => (
                                    <div key={room.id} className="box glass-light mb-4 p-4 hover:border-white/20 transition-all is-flex is-justify-content-between is-align-items-center">
                                        <div>
                                            <div className="is-flex is-align-items-center">
                                                <h4 className="title is-6 m-0 mr-2">{room.name}</h4>
                                                {room.password && <span className="tag is-danger is-rounded is-small">🔒</span>}
                                            </div>
                                            <p className="is-size-7 text-muted mt-1">
                                                {room.currentPlayers} Device{room.currentPlayers !== 1 ? 's' : ''} Connected
                                            </p>
                                        </div>
                                        <AnimatedButton
                                            onClick={() => handleJoinRoom(room.id, !!room.password)}
                                            disabled={isConnecting}
                                            className="is-info is-small px-4 font-bold"
                                        >
                                            Connect
                                        </AnimatedButton>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="🔒 Locked Room"
                actions={
                    <>
                        <AnimatedButton onClick={() => setShowPasswordModal(false)} className="is-light">Cancel</AnimatedButton>
                        <AnimatedButton 
                            onClick={() => pendingJoinRoomId && executeJoinRoom(pendingJoinRoomId, joinPassword)} 
                            className="is-primary"
                            disabled={!joinPassword}
                        >
                            Connect
                        </AnimatedButton>
                    </>
                }
            >
                <div className="field">
                    <label className="label">Enter Room Password:</label>
                    <div className="control">
                        <input 
                            className="input" 
                            type="password" 
                            value={joinPassword} 
                            onChange={e => setJoinPassword(e.target.value)}
                            placeholder="Password"
                            autoFocus
                        />
                    </div>
                </div>
            </Modal>

            <style jsx>{`
                .premium-input {
                    background: rgba(0, 0, 0, 0.4) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    height: 48px;
                    border-radius: 12px;
                }
                .premium-input:focus {
                    border-color: var(--primary-orange) !important;
                    background: rgba(0, 0, 0, 0.6) !important;
                }
            `}</style>
        </div>
    );
}
