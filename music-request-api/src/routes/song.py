from flask import Blueprint, request, jsonify
from src.models.song import Song
from src.models.user import db

song_bp = Blueprint('song', __name__)

@song_bp.route('/songs', methods=['GET'])
def get_songs():
    """Obter todas as músicas do repertório"""
    try:
        songs = Song.query.order_by(Song.title).all()
        return jsonify([song.to_dict() for song in songs]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@song_bp.route('/songs', methods=['POST'])
def add_song():
    """Adicionar uma nova música ao repertório"""
    try:
        data = request.get_json()
        
        if not data.get('title') or not data.get('artist') or not data.get('genre'):
            return jsonify({'error': 'Campos obrigatórios: title, artist, genre'}), 400
        
        relevance = data.get('relevance', 'medium')
        if relevance not in ['low', 'medium', 'high']:
            return jsonify({'error': 'Relevância inválida. Use: low, medium ou high'}), 400
        
        new_song = Song(
            title=data['title'],
            artist=data['artist'],
            genre=data['genre'],
            relevance=relevance
        )
        
        db.session.add(new_song)
        db.session.commit()
        
        return jsonify(new_song.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@song_bp.route('/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    """Remover uma música do repertório"""
    try:
        song = Song.query.get(song_id)
        if not song:
            return jsonify({'error': 'Música não encontrada'}), 404
        
        db.session.delete(song)
        db.session.commit()
        
        return jsonify({'message': 'Música removida com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@song_bp.route('/songs/search', methods=['GET'])
def search_songs():
    """Buscar músicas por título ou artista"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify([]), 200
        
        songs = Song.query.filter(
            db.or_(
                Song.title.ilike(f'%{query}%'),
                Song.artist.ilike(f'%{query}%')
            )
        ).all()
        
        return jsonify([song.to_dict() for song in songs]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

