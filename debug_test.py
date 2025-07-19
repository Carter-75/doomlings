#!/usr/bin/env python3
"""
Debug test for Doomlings Socket.IO server
"""

import asyncio
import socketio

async def debug_test():
    client = socketio.AsyncClient()
    
    @client.event
    async def connect():
        print("✅ Connected to server")
    
    @client.event
    async def disconnect():
        print("❌ Disconnected from server")
    
    @client.event
    async def player_registered(data):
        print(f"✅ Player registered: {data}")
    
    @client.event
    async def room_updated(data):
        print(f"✅ Room updated: {data.get('id')} - Players: {len(data.get('players', []))}")
        for i, player in enumerate(data.get('players', [])):
            print(f"  Player {i+1}: {player.get('name')} (Ready: {player.get('ready')})")
    
    @client.event
    async def game_started(data):
        print(f"🎮 Game started! Room: {data.get('id')}")
        print(f"   Players: {len(data.get('players', []))}")
        if data.get('players'):
            player = data['players'][0]
            print(f"   First player hand size: {len(player.get('hand', []))}")
            print(f"   First player gene pool: {player.get('genePool')}")
    
    @client.event
    async def chat_message(data):
        print(f"💬 Chat: {data.get('playerName')}: {data.get('message')}")
    
    # Add generic event handler to catch all events
    @client.event
    async def connect_error(data):
        print(f"❌ Connection error: {data}")
    
    # Catch all other events
    original_emit = client.emit
    async def debug_emit(event, data=None, namespace=None, callback=None, timeout=60):
        print(f"📤 Emitting: {event} with data: {data}")
        return await original_emit(event, data, namespace, callback, timeout)
    client.emit = debug_emit
    
    try:
        await client.connect("http://localhost:3000")
        
        # Register player
        print("\n1. Registering player...")
        response = await client.call('join-as-player', "DebugPlayer", timeout=5)
        print(f"Registration response: {response}")
        
        # Create room
        print("\n2. Creating room...")
        room_data = {
            'roomName': 'Debug Room',
            'maxPlayers': 2,
            'isPrivate': False,
            'gameSettings': {'expansions': ['base']}
        }
        room_response = await client.call('create-room', room_data, timeout=5)
        print(f"Room creation response: {room_response}")
        
        if room_response and room_response.get('success'):
            room_id = room_response.get('roomId')
            
            # Join the room after creating it
            print(f"\n3. Joining room {room_id}...")
            join_data = {
                'roomId': room_id,
                'playerName': 'DebugPlayer'
            }
            join_response = await client.call('join-room', join_data, timeout=5)
            print(f"Join response: {join_response}")
            
            # Set player ready
            print(f"\n4. Setting player ready in room {room_id}...")
            ready_data = {'roomId': room_id, 'ready': True}
            await client.emit('player-ready', ready_data)
            
            # Wait for events
            print("\n5. Waiting for game start...")
            await asyncio.sleep(5)
        
        await client.disconnect()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_test())