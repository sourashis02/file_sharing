# Generated by Django 5.1.3 on 2024-12-21 16:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('file_sys', '0005_alter_filedata_nonce_alter_filedata_tag'),
    ]

    operations = [
        migrations.AddField(
            model_name='filedata',
            name='sharedWith',
            field=models.JSONField(default=list),
        ),
    ]