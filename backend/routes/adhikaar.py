from flask import Blueprint, request, jsonify
from services.adhikaar_service import get_legal_advice

adhikaar_bp = Blueprint("adhikaar", __name__)

@adhikaar_bp.route("/adhikaar", methods=["POST"])
def adhikaar():
    data = request.get_json()
    
    if not data or "query" not in data:
        return jsonify({"error": "Missing query"}), 400
    
    query = data["query"]

    try:
        answer = get_legal_advice(query)
        return jsonify({"answer": answer})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
