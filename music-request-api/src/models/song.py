from src.models.user import db

class Song(db.Model):
    __tablename__ = 'songs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    genre = db.Column(db.String(100), nullable=False)
    relevance = db.Column(db.String(20), default='medium')  # low, medium, high
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def get_price(self):
        """Retorna o preço baseado na relevância"""
        prices = {
            'low': 3.00,
            'medium': 5.00,
            'high': 8.00
        }
        return prices.get(self.relevance, 5.00)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'artist': self.artist,
            'genre': self.genre,
            'relevance': self.relevance,
            'price': self.get_price(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

