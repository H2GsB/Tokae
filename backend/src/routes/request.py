from flask import Blueprint, request, jsonify
from src.models.request import Request
from src.models.song import Song
from src.models.user import db
import json

request_bp = Blueprint('request', __name__)

@request_bp.route('/requests', methods=['GET'])
def get_requests():
    """Obter todos os pedidos ordenados por pagamento, valor e prioridade"""
    try:
        status_filter = request.args.get('status')
        
        query = Request.query
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        # Apenas pedidos com pagamento concluído ou gratuitos (que já são completed)
        query = query.filter_by(payment_status='completed')
        
        # Ordenar por:
        # 1. Status (pending primeiro, depois queue, playing, completed por último)
        # 2. Se é pago (pagos primeiro)
        # 3. Valor pago (maior valor primeiro)
        # 4. Prioridade de redes sociais (mais redes primeiro)
        # 5. Data de criação (mais antigo primeiro)
        requests = query.order_by(
            db.case(
                (Request.status == 'pending', 0),
                (Request.status == 'queue', 1),
                (Request.status == 'playing', 2),
                (Request.status == 'completed', 3),
                else_=4
            ),
            Request.is_free.asc(),  # False (pago) vem primeiro
            Request.price_paid.desc(),
            Request.priority.desc(),
            Request.created_at.asc()
        ).all()
        
        return jsonify([req.to_dict() for req in requests]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@request_bp.route('/requests', methods=['POST'])
def create_request():
    """Criar um novo pedido de música"""
    try:
        data = request.get_json()
        
        # Validações
        required_fields = ['song_id', 'user_name', 'user_social', 'social_platforms']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo obrigatório: {field}'}), 400
        
        # Verificar se a música existe
        song = Song.query.get(data['song_id'])
        if not song:
            return jsonify({'error': 'Música não encontrada'}), 404
        
        # Calcular prioridade baseado nas redes sociais seguidas
        social_platforms = data['social_platforms']
        priority = sum([
            1 if social_platforms.get('instagram') else 0,
            1 if social_platforms.get('tiktok') else 0,
            1 if social_platforms.get('youtube') else 0
        ])
        
        if priority == 0:
            return jsonify({'error': 'Siga o artista em pelo menos uma rede social'}), 400
        
        # Verificar se é o primeiro pedido do usuário (gratuito)
        user_social = data['user_social']
        previous_requests = Request.query.filter_by(user_social=user_social).count()
        is_free = previous_requests == 0
        
        # Calcular preço
        price = 0.0 if is_free else song.get_price()
        
        new_request = Request(
            song_id=data['song_id'],
            user_name=data['user_name'],
            user_social=user_social,
            message=data.get('message', ''),
            social_platforms=json.dumps(social_platforms),
            priority=priority,
            status='pending',
            is_free=is_free,
            price_paid=price,
            payment_status='completed' if is_free else 'pending'
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify(new_request.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@request_bp.route('/requests/<int:request_id>', methods=['PATCH'])
def update_request(request_id):
    """Atualizar status de um pedido"""
    try:
        req = Request.query.get(request_id)
        if not req:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        
        data = request.get_json()
        
        if 'status' in data:
            valid_statuses = ['pending', 'queue', 'playing', 'completed']
            if data['status'] not in valid_statuses:
                return jsonify({'error': 'Status inválido'}), 400
            req.status = data['status']
        
        if 'likes' in data:
            req.likes = data['likes']
        
        if 'payment_status' in data:
            valid_payment_statuses = ['pending', 'completed', 'failed']
            if data['payment_status'] not in valid_payment_statuses:
                return jsonify({'error': 'Status de pagamento inválido'}), 400
            req.payment_status = data['payment_status']
        
        db.session.commit()
        
        return jsonify(req.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@request_bp.route('/requests/<int:request_id>', methods=['DELETE'])
def delete_request(request_id):
    """Remover um pedido"""
    try:
        req = Request.query.get(request_id)
        if not req:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        
        db.session.delete(req)
        db.session.commit()
        
        return jsonify({'message': 'Pedido removido com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@request_bp.route('/requests/<int:request_id>/like', methods=['POST'])
def like_request(request_id):
    """Curtir um pedido"""
    try:
        req = Request.query.get(request_id)
        if not req:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        
        req.likes += 1
        db.session.commit()
        
        return jsonify(req.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@request_bp.route('/check-free-request/<user_social>', methods=['GET'])
def check_free_request(user_social):
    """Verificar se o usuário tem direito a pedido gratuito"""
    try:
        previous_requests = Request.query.filter_by(user_social=user_social).count()
        has_free_request = previous_requests == 0
        
        return jsonify({
            'has_free_request': has_free_request,
            'total_requests': previous_requests
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@request_bp.route('/stats', methods=['GET'])
def get_stats():
    """Obter estatísticas gerais"""
    try:
        total_requests = Request.query.count()
        pending_requests = Request.query.filter_by(status='pending').count()
        completed_requests = Request.query.filter_by(status='completed').count()
        
        # Calcular novos seguidores (soma das prioridades)
        requests = Request.query.all()
        new_followers = sum([req.priority for req in requests])
        
        # Usuários únicos ativos
        active_users = db.session.query(Request.user_social).distinct().count()
        
        # Calcular receita total
        total_revenue = db.session.query(db.func.sum(Request.price_paid)).filter(
            Request.payment_status == 'completed'
        ).scalar() or 0.0
        
        # Pedidos pagos vs gratuitos
        paid_requests = Request.query.filter_by(is_free=False).count()
        free_requests = Request.query.filter_by(is_free=True).count()
        
        return jsonify({
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'completed_requests': completed_requests,
            'new_followers': new_followers,
            'active_users': active_users,
            'total_revenue': round(total_revenue, 2),
            'paid_requests': paid_requests,
            'free_requests': free_requests
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

