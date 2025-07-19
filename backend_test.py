#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Doomlings Multiplayer Game
Tests Socket.IO server functionality including:
- WebSocket connections
- Player registration
- Room management
- Game flow
- Error handling
"""

import asyncio
import json
import time
import sys
import subprocess
import signal
import os
from typing import Dict, List, Any, Optional

try:
    import socketio
    import requests
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-socketio[asyncio_client]", "requests"])
    import socketio
    import requests

class DoomlingsGameTester:
    def __init__(self, server_url: str = "http://localhost:3000"):
        self.server_url = server_url
        self.clients: List[socketio.AsyncClient] = []
        self.test_results: Dict[str, Any] = {}
        self.server_process = None
        
    async def setup_client(self, client_id: str) -> socketio.AsyncClient:
        """Create and connect a new Socket.IO client"""
        client = socketio.AsyncClient()
        
        @client.event
        async def connect():
            print(f"Client {client_id} connected to server")
            
        @client.event
        async def disconnect():
            print(f"Client {client_id} disconnected from server")
            
        @client.on('player-registered')
        async def player_registered(data):
            print(f"Client {client_id} registered as player: {data}")
            
        @client.on('room-updated')
        async def room_updated(data):
            print(f"Client {client_id} received room update: {data.get('id', 'unknown')} with {len(data.get('players', []))} players")
            
        @client.on('game-started')
        async def game_started(data):
            print(f"Client {client_id} received game started event for room: {data.get('id', 'unknown')}")
            
        @client.on('game-updated')
        async def game_updated(data):
            print(f"Client {client_id} received game update for room: {data.get('id', 'unknown')}")
            
        @client.on('chat-message')
        async def chat_message(data):
            print(f"Client {client_id} received chat: {data.get('playerName', 'Unknown')}: {data.get('message', '')}")
        
        self.clients.append(client)
        return client
    
    def start_server(self):
        """Start the Node.js server"""
        try:
            print("Starting Node.js server...")
            self.server_process = subprocess.Popen(
                ["node", "server-with-socket.js"],
                cwd="/app",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
            
            # Wait for server to start
            time.sleep(3)
            
            # Check if server is running
            if self.server_process.poll() is None:
                print("Server started successfully")
                return True
            else:
                stdout, stderr = self.server_process.communicate()
                print(f"Server failed to start. STDOUT: {stdout.decode()}, STDERR: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"Error starting server: {e}")
            return False
    
    def stop_server(self):
        """Stop the Node.js server"""
        if self.server_process:
            try:
                os.killpg(os.getpgid(self.server_process.pid), signal.SIGTERM)
                self.server_process.wait(timeout=5)
                print("Server stopped successfully")
            except Exception as e:
                print(f"Error stopping server: {e}")
                try:
                    os.killpg(os.getpgid(self.server_process.pid), signal.SIGKILL)
                except:
                    pass
    
    async def test_server_connection(self) -> bool:
        """Test basic Socket.IO server connection"""
        print("\n=== Testing Socket.IO Server Connection ===")
        
        try:
            client = await self.setup_client("connection_test")
            await client.connect(self.server_url)
            
            # Wait a moment to ensure connection is established
            await asyncio.sleep(1)
            
            if client.connected:
                print("✅ Socket.IO server connection successful")
                await client.disconnect()
                return True
            else:
                print("❌ Socket.IO server connection failed")
                return False
                
        except Exception as e:
            print(f"❌ Socket.IO server connection error: {e}")
            return False
    
    async def test_player_registration(self) -> bool:
        """Test player registration functionality"""
        print("\n=== Testing Player Registration ===")
        
        try:
            client = await self.setup_client("player_test")
            await client.connect(self.server_url)
            
            # Test player registration
            player_name = "TestPlayer1"
            response = await client.call('join-as-player', player_name, timeout=5)
            
            if response and response.get('success'):
                player_id = response.get('playerId')
                print(f"✅ Player registration successful. Player ID: {player_id}")
                await client.disconnect()
                return True
            else:
                print(f"❌ Player registration failed: {response}")
                await client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Player registration error: {e}")
            return False
    
    async def test_room_creation(self) -> bool:
        """Test room creation functionality"""
        print("\n=== Testing Room Creation ===")
        
        try:
            client = await self.setup_client("room_creator")
            await client.connect(self.server_url)
            
            # Register player first
            player_response = await client.call('join-as-player', "RoomCreator", timeout=5)
            if not player_response or not player_response.get('success'):
                print("❌ Failed to register player for room creation test")
                await client.disconnect()
                return False
            
            # Create room
            room_data = {
                'roomName': 'Test Room',
                'maxPlayers': 4,
                'isPrivate': False,
                'gameSettings': {
                    'expansions': ['base'],
                    'catastropheMode': False,
                    'catastropheAges': 2,
                    'normalAges': 8,
                    'merchantAges': 2
                }
            }
            
            room_response = await client.call('create-room', room_data, timeout=5)
            
            if room_response and room_response.get('success'):
                room_id = room_response.get('roomId')
                print(f"✅ Room creation successful. Room ID: {room_id}")
                await client.disconnect()
                return True
            else:
                print(f"❌ Room creation failed: {room_response}")
                await client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Room creation error: {e}")
            return False
    
    async def test_room_joining(self) -> bool:
        """Test room joining functionality with multiple players"""
        print("\n=== Testing Room Joining ===")
        
        try:
            # Create room with first client
            creator_client = await self.setup_client("room_creator")
            await creator_client.connect(self.server_url)
            
            # Register creator
            creator_response = await creator_client.call('join-as-player', "RoomCreator", timeout=5)
            if not creator_response or not creator_response.get('success'):
                print("❌ Failed to register room creator")
                return False
            
            # Create room
            room_data = {
                'roomName': 'Multi-Player Test Room',
                'maxPlayers': 4,
                'isPrivate': False,
                'gameSettings': {'expansions': ['base']}
            }
            
            room_response = await creator_client.call('create-room', room_data, timeout=5)
            if not room_response or not room_response.get('success'):
                print("❌ Failed to create room for joining test")
                return False
            
            room_id = room_response.get('roomId')
            print(f"Room created with ID: {room_id}")
            
            # Create second client to join room
            joiner_client = await self.setup_client("room_joiner")
            await joiner_client.connect(self.server_url)
            
            # Register joiner
            joiner_response = await joiner_client.call('join-as-player', "RoomJoiner", timeout=5)
            if not joiner_response or not joiner_response.get('success'):
                print("❌ Failed to register room joiner")
                return False
            
            # Join room
            join_data = {
                'roomId': room_id,
                'playerName': 'RoomJoiner'
            }
            
            join_response = await joiner_client.call('join-room', join_data, timeout=5)
            
            if join_response and join_response.get('success'):
                room = join_response.get('room')
                player_count = len(room.get('players', []))
                print(f"✅ Room joining successful. Room now has {player_count} players")
                
                await creator_client.disconnect()
                await joiner_client.disconnect()
                return True
            else:
                print(f"❌ Room joining failed: {join_response}")
                await creator_client.disconnect()
                await joiner_client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Room joining error: {e}")
            return False
    
    async def test_player_ready_and_game_start(self) -> bool:
        """Test player ready status and game start functionality"""
        print("\n=== Testing Player Ready Status and Game Start ===")
        
        try:
            # Create room and join with one player (single-player mode for testing)
            client = await self.setup_client("ready_test")
            await client.connect(self.server_url)
            
            # Register player
            player_response = await client.call('join-as-player', "ReadyPlayer", timeout=5)
            if not player_response or not player_response.get('success'):
                print("❌ Failed to register player for ready test")
                return False
            
            # Create room
            room_data = {
                'roomName': 'Ready Test Room',
                'maxPlayers': 2,
                'isPrivate': False,
                'gameSettings': {'expansions': ['base']}
            }
            
            room_response = await client.call('create-room', room_data, timeout=5)
            if not room_response or not room_response.get('success'):
                print("❌ Failed to create room for ready test")
                return False
            
            room_id = room_response.get('roomId')
            
            # Join the room after creating it
            join_data = {
                'roomId': room_id,
                'playerName': 'ReadyPlayer'
            }
            join_response = await client.call('join-room', join_data, timeout=5)
            if not join_response or not join_response.get('success'):
                print("❌ Failed to join room for ready test")
                return False
            
            # Set up event listener for game start
            game_started = False
            
            @client.on('game-started')
            async def game_started_event(data):
                nonlocal game_started
                game_started = True
                print(f"Game started event received for room: {data.get('id')}")
            
            # Set player ready
            ready_data = {
                'roomId': room_id,
                'ready': True
            }
            
            await client.emit('player-ready', ready_data)
            
            # Wait for game to start (single player should trigger start)
            await asyncio.sleep(3)
            
            if game_started:
                print("✅ Player ready status and game start successful")
                await client.disconnect()
                return True
            else:
                print("❌ Game did not start after player ready")
                await client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Player ready and game start error: {e}")
            return False
    
    async def test_game_state_initialization(self) -> bool:
        """Test game state initialization (hands, gene pools, etc.)"""
        print("\n=== Testing Game State Initialization ===")
        
        try:
            client = await self.setup_client("game_state_test")
            await client.connect(self.server_url)
            
            # Register player
            player_response = await client.call('join-as-player', "GameStatePlayer", timeout=5)
            if not player_response or not player_response.get('success'):
                print("❌ Failed to register player for game state test")
                return False
            
            # Create room
            room_data = {
                'roomName': 'Game State Test Room',
                'maxPlayers': 2,
                'isPrivate': False,
                'gameSettings': {'expansions': ['base']}
            }
            
            room_response = await client.call('create-room', room_data, timeout=5)
            if not room_response or not room_response.get('success'):
                print("❌ Failed to create room for game state test")
                return False
            
            room_id = room_response.get('roomId')
            
            # Join the room after creating it
            join_data = {
                'roomId': room_id,
                'playerName': 'GameStatePlayer'
            }
            join_response = await client.call('join-room', join_data, timeout=5)
            if not join_response or not join_response.get('success'):
                print("❌ Failed to join room for game state test")
                return False
            
            # Set up event listener for game start
            game_data = None
            
            @client.on('game-started')
            async def game_started_event(data):
                nonlocal game_data
                game_data = data
                print(f"Game started with data received")
            
            # Set player ready to start game
            ready_data = {
                'roomId': room_id,
                'ready': True
            }
            
            await client.emit('player-ready', ready_data)
            
            # Wait for game to start
            await asyncio.sleep(3)
            
            if game_data:
                players = game_data.get('players', [])
                if players:
                    player = players[0]
                    hand = player.get('hand', [])
                    gene_pool = player.get('genePool', 0)
                    trait_pile = player.get('traitPile', [])
                    
                    print(f"Player hand size: {len(hand)}")
                    print(f"Player gene pool: {gene_pool}")
                    print(f"Player trait pile size: {len(trait_pile)}")
                    
                    if len(hand) > 0 and gene_pool == 8:
                        print("✅ Game state initialization successful")
                        await client.disconnect()
                        return True
                    else:
                        print("❌ Game state initialization incomplete")
                        await client.disconnect()
                        return False
                else:
                    print("❌ No players found in game data")
                    await client.disconnect()
                    return False
            else:
                print("❌ No game data received")
                await client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Game state initialization error: {e}")
            return False
    
    async def test_card_playing(self) -> bool:
        """Test basic card playing functionality"""
        print("\n=== Testing Card Playing ===")
        
        try:
            client = await self.setup_client("card_play_test")
            await client.connect(self.server_url)
            
            # Register player
            player_response = await client.call('join-as-player', "CardPlayer", timeout=5)
            if not player_response or not player_response.get('success'):
                print("❌ Failed to register player for card play test")
                return False
            
            # Create room and start game
            room_data = {
                'roomName': 'Card Play Test Room',
                'maxPlayers': 2,
                'isPrivate': False,
                'gameSettings': {'expansions': ['base']}
            }
            
            room_response = await client.call('create-room', room_data, timeout=5)
            if not room_response or not room_response.get('success'):
                print("❌ Failed to create room for card play test")
                return False
            
            room_id = room_response.get('roomId')
            
            # Join the room after creating it
            join_data = {
                'roomId': room_id,
                'playerName': 'CardPlayer'
            }
            join_response = await client.call('join-room', join_data, timeout=5)
            if not join_response or not join_response.get('success'):
                print("❌ Failed to join room for card play test")
                return False
            
            # Set up event listeners
            game_data = None
            game_updated = False
            
            @client.on('game-started')
            async def game_started_event(data):
                nonlocal game_data
                game_data = data
            
            @client.on('game-updated')
            async def game_updated_event(data):
                nonlocal game_updated
                game_updated = True
                print("Game updated event received after card play")
            
            # Start game
            await client.emit('player-ready', {'roomId': room_id, 'ready': True})
            await asyncio.sleep(3)
            
            if game_data and game_data.get('players'):
                player = game_data['players'][0]
                hand = player.get('hand', [])
                
                if hand:
                    # Play first card
                    card_to_play = hand[0]
                    play_data = {
                        'roomId': room_id,
                        'cardId': card_to_play['id']
                    }
                    
                    await client.emit('play-card', play_data)
                    await asyncio.sleep(2)
                    
                    if game_updated:
                        print("✅ Card playing successful")
                        await client.disconnect()
                        return True
                    else:
                        print("❌ No game update received after card play")
                        await client.disconnect()
                        return False
                else:
                    print("❌ No cards in hand to play")
                    await client.disconnect()
                    return False
            else:
                print("❌ Game did not start properly for card play test")
                await client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Card playing error: {e}")
            return False
    
    async def test_error_handling(self) -> bool:
        """Test error handling for invalid scenarios"""
        print("\n=== Testing Error Handling ===")
        
        try:
            client = await self.setup_client("error_test")
            await client.connect(self.server_url)
            
            # Test 1: Try to join non-existent room
            join_data = {
                'roomId': 'NONEXISTENT',
                'playerName': 'ErrorTester'
            }
            
            join_response = await client.call('join-room', join_data, timeout=5)
            
            if join_response and not join_response.get('success'):
                error_msg = join_response.get('error', '')
                if 'not found' in error_msg.lower():
                    print("✅ Error handling for non-existent room works")
                else:
                    print(f"❌ Unexpected error message: {error_msg}")
                    return False
            else:
                print("❌ Should have failed to join non-existent room")
                return False
            
            # Test 2: Try to create room without being registered
            room_data = {
                'roomName': 'Error Test Room',
                'maxPlayers': 4,
                'isPrivate': False,
                'gameSettings': {'expansions': ['base']}
            }
            
            room_response = await client.call('create-room', room_data, timeout=5)
            
            if room_response and not room_response.get('success'):
                error_msg = room_response.get('error', '')
                if 'not registered' in error_msg.lower():
                    print("✅ Error handling for unregistered player works")
                else:
                    print(f"❌ Unexpected error message: {error_msg}")
                    return False
            else:
                print("❌ Should have failed to create room without registration")
                return False
            
            await client.disconnect()
            print("✅ Error handling tests successful")
            return True
                
        except Exception as e:
            print(f"❌ Error handling test error: {e}")
            return False
    
    async def test_disconnection_scenarios(self) -> bool:
        """Test disconnection handling"""
        print("\n=== Testing Disconnection Scenarios ===")
        
        try:
            # Create two clients
            client1 = await self.setup_client("disconnect_test_1")
            client2 = await self.setup_client("disconnect_test_2")
            
            await client1.connect(self.server_url)
            await client2.connect(self.server_url)
            
            # Register both players
            await client1.call('join-as-player', "Player1", timeout=5)
            await client2.call('join-as-player', "Player2", timeout=5)
            
            # Create room with first client
            room_data = {
                'roomName': 'Disconnect Test Room',
                'maxPlayers': 4,
                'isPrivate': False,
                'gameSettings': {'expansions': ['base']}
            }
            
            room_response = await client1.call('create-room', room_data, timeout=5)
            room_id = room_response.get('roomId')
            
            # Second client joins room
            join_data = {
                'roomId': room_id,
                'playerName': 'Player2'
            }
            await client2.call('join-room', join_data, timeout=5)
            
            # Set up event listener for room updates
            room_updated = False
            
            @client1.event
            async def room_updated_event(data):
                nonlocal room_updated
                room_updated = True
                print(f"Room updated after disconnection: {len(data.get('players', []))} players remaining")
            
            # Disconnect second client
            await client2.disconnect()
            await asyncio.sleep(1)
            
            if room_updated:
                print("✅ Disconnection handling successful")
                await client1.disconnect()
                return True
            else:
                print("❌ No room update received after disconnection")
                await client1.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Disconnection test error: {e}")
            return False
    
    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all backend tests"""
        print("🎮 Starting Doomlings Multiplayer Game Backend Tests")
        print("=" * 60)
        
        # Check if server is already running
        try:
            response = requests.get(f"{self.server_url}/", timeout=5)
            print("✅ Server is already running, proceeding with tests")
        except:
            # Start server if not running
            if not self.start_server():
                print("❌ Failed to start server. Cannot run tests.")
                return {}
        
        try:
            # Wait for server to be fully ready
            await asyncio.sleep(2)
            
            # Run all tests
            tests = [
                ("Socket.IO Server Connection", self.test_server_connection),
                ("Player Registration", self.test_player_registration),
                ("Room Creation", self.test_room_creation),
                ("Room Joining", self.test_room_joining),
                ("Player Ready Status", self.test_player_ready_and_game_start),
                ("Game State Initialization", self.test_game_state_initialization),
                ("Card Playing", self.test_card_playing),
                ("Error Handling", self.test_error_handling),
                ("Disconnection Scenarios", self.test_disconnection_scenarios),
            ]
            
            results = {}
            
            for test_name, test_func in tests:
                try:
                    result = await test_func()
                    results[test_name] = result
                    
                    # Clean up any remaining connections
                    for client in self.clients:
                        if client.connected:
                            await client.disconnect()
                    self.clients.clear()
                    
                    # Small delay between tests
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    print(f"❌ Test '{test_name}' failed with exception: {e}")
                    results[test_name] = False
            
            return results
            
        finally:
            # Only stop server if we started it
            if self.server_process:
                self.stop_server()
    
    def print_summary(self, results: Dict[str, bool]):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🎮 DOOMLINGS BACKEND TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print("-" * 60)
        print(f"Total: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend tests passed!")
        else:
            print(f"⚠️  {total - passed} test(s) failed")
        
        return passed == total

async def main():
    """Main test execution"""
    tester = DoomlingsGameTester()
    
    try:
        results = await tester.run_all_tests()
        success = tester.print_summary(results)
        
        # Return appropriate exit code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        tester.stop_server()
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {e}")
        tester.stop_server()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())