# Generated by Django 5.1.3 on 2024-12-18 11:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('file_sys', '0002_filedata_key_alter_filedata_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='filedata',
            name='key',
            field=models.CharField(max_length=32),
        ),
    ]