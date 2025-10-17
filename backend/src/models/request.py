from src.models.user import db
import json

class Request(db.Model):
    __tablename__ = 'requests'
    
    id = db.Column(db.Integer, primary_key=True)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id'), nullable=False)
    user_name = db.Column(db.String(200), nullable=False)
    user_social = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=True)
    social_platforms = db.Column(db.Text, nullable=False)  # JSON string
    status = db.Column(db.String(50), default='pending')  # pending, queue, playing, completed
    priority = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    is_free = db.Column(db.Boolean, default=False)  # Se é o primeiro pedido gratuito
    price_paid = db.Column(db.Float, default=0.0)  # Valor pago pelo pedido
    payment_status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationship
    song = db.relationship('Song', backref='requests')
    
    def to_dict(self):
        return {
            'id': self.id,
            'song_id': self.song_id,
            'song': self.song.title if self.song else None,
            'user_name': self.user_name,
            'user_social': self.user_social,
            'message': self.message,
            'social_platforms': json.loads(self.social_platforms) if self.social_platforms else {},
            'status': self.status,
            'priority': self.priority,
            'likes': self.likes,
            'is_free': self.is_free,
            'price_paid': self.price_paid,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

