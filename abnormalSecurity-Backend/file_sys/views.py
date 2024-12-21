from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from file_sys.models import FileData, SharedWith
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from django.http import HttpResponse
from users.models import CustomUser as User


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
        owner_files = FileData.objects.filter(user=request.user)
        shared_files = SharedWith.objects.filter(user=request.user)
        
        owener_file_list = []
        shared_file_list = []
        
        for file in owner_files:
            owener_file_list.append({
                "id": file.id,
                "file_name": file.name,
                "file_path": file.filePath,
                "owner": file.user.name
            })
        for shared_file in shared_files:
            shared_file_list.append({
                "id": shared_file.file.id,
                "file_name": shared_file.file.name,
                "file_path": shared_file.file.filePath,
                "owner": shared_file.file.user.name
            })
        resp_data={
            "owner_files": owener_file_list,
            "shared_files": shared_file_list
        }
        return Response(resp_data, status=status.HTTP_200_OK)
    
    
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
        
class FileShareAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        email=request.data.get('email')
        id=request.data.get('id')
        if not id:
            return Response({"error": "File ID is missing."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file = FileData.objects.get(id=int(id))
        except FileData.DoesNotExist:
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id != file.user.id:
            return Response({"error": "You cannot share other user's file."}, status=status.HTTP_400_BAD_REQUEST)
        user=User.objects.get(email=email)
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        SharedWith.objects.create(file=file,user=user)
        return Response({"message": "File shared successfully."}, status=status.HTTP_200_OK)
        
        