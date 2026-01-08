from django.core.management.base import BaseCommand
from django.db import connection
import os


class Command(BaseCommand):
    help = 'Load data from cinema_inserts.sql file'

    def handle(self, *args, **options):
        sql_file = '/app/cinema_inserts.sql'
        
        if not os.path.exists(sql_file):
            self.stdout.write(self.style.WARNING(f'SQL file not found: {sql_file}'))
            return
        
        # Check if data already exists by checking multiple application tables
        with connection.cursor() as cursor:
            # Check if any application data exists (not Django system tables)
            try:
                cursor.execute("SELECT COUNT(*) FROM movies_movie")
                movies_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM screenings_screening")
                screenings_count = cursor.fetchone()[0]
                
                if movies_count > 0 or screenings_count > 0:
                    self.stdout.write(self.style.WARNING('Application data already exists in database. Skipping SQL import.'))
                    return
            except Exception:
                # Tables don't exist yet, proceed with import
                pass
        
        self.stdout.write(self.style.SUCCESS('Loading data from SQL file...'))
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Filter out Django-managed tables to avoid conflicts
        # These tables are automatically populated by Django migrations
        django_tables = [
            'django_content_type',
            'auth_permission',
            'auth_group',
            'django_admin_log',
            'django_session',
            'django_migrations',
        ]
        
        # Split SQL into lines and filter out INSERT statements for Django tables
        lines = sql_content.split('\n')
        filtered_lines = []
        skip_until_semicolon = False
        
        for line in lines:
            # Check if this line starts an INSERT into a Django table
            if any(f'INSERT INTO public.{table}' in line for table in django_tables):
                skip_until_semicolon = True
                continue
            
            # Skip lines until we find the semicolon ending the INSERT
            if skip_until_semicolon:
                if ';' in line:
                    skip_until_semicolon = False
                continue
            
            filtered_lines.append(line)
        
        sql = '\n'.join(filtered_lines)
        
        with connection.cursor() as cursor:
            try:
                cursor.execute(sql)
                self.stdout.write(self.style.SUCCESS('Successfully loaded data from SQL file'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error loading SQL: {str(e)}'))
                raise
