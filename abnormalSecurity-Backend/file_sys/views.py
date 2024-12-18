from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from file_sys.models import FileData
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from django.http import HttpResponse


def encrypt_at_rest(data, key):
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    return cipher.nonce, tag, ciphertext

def decrypt_file(encrypted_data, key, nonce, tag):
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    decrypted_data = cipher.decrypt_and_verify(encrypted_data, tag)
    return decrypted_data
    
    
class FileUploadAPIView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_data = file.read()
            key = get_random_bytes(32)

            nonce, tag, ciphertext = encrypt_at_rest(file_data, key)

            encrypted_file_name = f"encrypted_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.name}"
            encrypted_file_path = default_storage.save(
                encrypted_file_name, ContentFile(ciphertext)
            )
            fileId=FileData.objects.create(
                name=file.name,
                user=request.user,
                filePath=encrypted_file_path,
                key=key.hex(),
                nonce=nonce.hex(),
                tag=tag.hex()
            )
            response_data = {
                "id": fileId.id,
                "file_name": encrypted_file_name,
                "file_path": encrypted_file_path,
                "message": "File uploaded successfully."
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
class FileListAPIView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self, request, *args, **kwargs):
        files = FileData.objects.filter(user=request.user)
        file_list = []
        for file in files:
            file_list.append({
                "id": file.id,
                "file_name": file.name,
                "file_path": file.filePath
            })
        return Response(file_list, status=status.HTTP_200_OK)
    
    
class FileDownloadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request,id):
        if not id:
            return Response({"error": "File ID is missing."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file = FileData.objects.get(id=int(id))
        except FileData.DoesNotExist:
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        with open(file.filePath, "rb") as encrypted_file:
            encrypted_data = encrypted_file.read()

        try:
            key = bytes.fromhex(file.key)
            nonce = bytes.fromhex(file.nonce)
            tag = bytes.fromhex(file.tag)
            decrypted_data = decrypt_file(encrypted_data, key, nonce, tag)

            response = HttpResponse(
                decrypted_data,
                content_type="application/octet-stream"
            )
            response['Content-Disposition'] = f'attachment; filename="{file.name}"'
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        