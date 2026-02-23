# 📂 Project Structure - PGESTOR  

This project follows a **Django MVC (Model-View-Controller) architecture**, organizing the backend, frontend, and data management into structured modules.

```bash
PGESTOR/
│── carteira/                     # Main Django application
│   │── migrations/               # Database migration files
│   │── static/                   # Static assets (CSS, JS, images)
│   │── templates/carteira/        # HTML templates for UI
│   │── __init__.py                # Marks this directory as a Python package
│   │── admin.py                   # Admin panel configurations
│   │── apps.py                    # Django app configuration
│   │── decorators.py              # Custom access control decorators
│   │── forms.py                   # Django forms for user input validation
│   │── models.py                  # Database models for startups, mentors, and sessions
│   │── resources.py               # Import/export utilities
│   │── tests.py                   # Unit tests for the application
│   │── urls.py                    # URL routing configuration
│   │── views.py                    # Business logic and request handling
│
│── pgestor/                       # Core project configuration folder
│   │── __init__.py                # Marks this directory as a Python package
│   │── asgi.py                    # ASGI entry point for async Django apps
│   │── settings.py                 # Django project settings (without sensitive data)
│   │── urls.py                     # Global URL configuration
│   │── wsgi.py                     # WSGI entry point for deployment
│
│── .env                            # Environment variables file (not included in the repository)
│── db.sqlite3                       # SQLite database file (not included in the repository)
│── db_novo.sqlite3                   # Alternative database file
│── manage.py                         # Django command-line utility
│── requirements.txt                   # List of dependencies required for the project


