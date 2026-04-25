import os
import tempfile
import json
from flask import Blueprint, request, jsonify
from services.document_service import process_document

document_bp = Blueprint("document", __name__)

@document_bp.route("/document", methods=["POST"])
def document():
    try:
        # ✅ Get messages (chat history)
        messages = request.form.get("messages", "[]")
        messages = json.loads(messages)

        file = request.files.get("file", None)
        temp_path = None
        content_type = ""

        # ✅ If file exists, save it
        if file and file.filename != "":
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, file.filename)
            file.save(temp_path)
            content_type = file.content_type

        # ✅ Process (with or without document)
        result = process_document(
            temp_path if temp_path else "",
            messages,
            content_type
        )

        # ✅ Cleanup
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({"result": result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500