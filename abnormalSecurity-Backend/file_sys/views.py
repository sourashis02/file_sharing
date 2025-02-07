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
import hashlib


def encrypt_at_rest(data, key):
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    return cipher.nonce, tag, ciphertext

def decrypt_file(encrypted_data, key, nonce, tag):
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    decrypted_data = cipher.decrypt_and_verify(encrypted_data, tag)
    return decrypted_data


def calculate_hash(file_path):
    hash_object = hashlib.sha256()
    
    hash_object.update(file_path)
    hash_hex = hash_object.hexdigest()
    
    return hash_hex
    
    
class FileUploadAPIView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        hash=request.data.get('hash')
        # print("hash",hash)
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
            
            calculated_hash = calculate_hash(file_data)
            print("calculated_hash",calculated_hash)
            print("hash",hash)
            if hash != calculated_hash:
                return Response({"error": "File hash does not match."}, status=status.HTTP_400_BAD_REQUEST)

            
            fileId=FileData.objects.create(
                name=file.name,
                user=request.user,
                filePath=encrypted_file_path,
                key=key.hex(),
                nonce=nonce.hex(),
                tag=tag.hex()
            )
            response_data = {
                "message": "File uploaded successfully.",
                "file": {
                    "id": fileId.id,
                    "file_name": fileId.name,
                    "file_path": fileId.filePath,
                    "owner": request.user.name
                }
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
        
        checkFilePermissionToDownload=False
        
        if request.user.id == file.user.id:
            checkFilePermissionToDownload=True
        elif SharedWith.objects.filter(file=file,user=request.user).exists():
            checkFilePermissionToDownload=True
        if not checkFilePermissionToDownload:
            return Response({"error": "You don't have permission to download this file."}, status=status.HTTP_403_FORBIDDEN)

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
        userList=request.data.get('userList')
        id=request.data.get('id')
        if not id:
            return Response({"error": "Invalid Input"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file = FileData.objects.get(id=int(id))
        except FileData.DoesNotExist:
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id != file.user.id:
            return Response({"error": "You cannot share other user's file."}, status=status.HTTP_400_BAD_REQUEST)
        
        sharedWithList=SharedWith.objects.filter(file=file)
        userAccessList=[]
        for sharedWith in sharedWithList:
            userAccessList.append(sharedWith.user.email)
        
        #Revoking access of users
        deleteAccessList=[]
        for sharedWith in sharedWithList:
            if sharedWith.user.email not in userList:
                deleteAccessList.append(sharedWith.id)
           
        if len(deleteAccessList)>0:     
            SharedWith.objects.filter(id__in=deleteAccessList).delete() 
        
        #Granting access of users
        newAccessList=[]
        for email in userList:
            if email not in userAccessList:
                newAccessList.append(email)
        #print(str(userList)+ '' + str(newAccessList))
        newAccessUserList=User.objects.filter(email__in=newAccessList)
        #print('New Access '+ str(len(newAccessUserList))+' '+str(newAccessList))
        if len(newAccessUserList) != len(newAccessList):
            return Response({"error": "Users not found."}, status=status.HTTP_404_NOT_FOUND)
        
        SharedWith.objects.bulk_create([
            SharedWith(file=file, user=user) for user in newAccessUserList
        ])
        return Response({"message": "File shared successfully."}, status=status.HTTP_200_OK)
    
class FileUserAccessAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request,id):
        if not id:
            return Response({"error": "File ID is missing."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file = FileData.objects.get(id=int(id))
        except FileData.DoesNotExist:
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if request.user.id != file.user.id:
            return Response({"error": "You cannot access other user's file."}, status=status.HTTP_400_BAD_REQUEST)
        
        sharedWithList=SharedWith.objects.filter(file=file)
        userAccessList=[]
        for sharedWith in sharedWithList:
            userAccessList.append({
                "id":sharedWith.user.id,
                "name":sharedWith.user.name,
                "email":sharedWith.user.email,
                "fileId":sharedWith.file.id
            })
        return Response({"users":userAccessList}, status=status.HTTP_200_OK)
        
        