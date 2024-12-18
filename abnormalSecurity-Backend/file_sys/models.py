from django.db import models

# Create your models here.
class FileData(models.Model):
    id=models.AutoField(primary_key=True,unique=True)
    name = models.CharField(max_length=255)
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    filePath = models.CharField(max_length=255)
    key=models.CharField(max_length=32)
    nonce=models.CharField(max_length=255)
    tag=models.CharField(max_length=255)

    def __str__(self):
        return self.id
