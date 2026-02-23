from django.db import models
from django.utils.text import slugify
from django.db.models import Count
from django.utils import timezone
from datetime import date
from django.core.exceptions import ValidationError

############################################ Group ############################################
class Group(models.Model):
    GROUP_CHOICES = (
        ('1', 'Group 1'),
        ('2', 'Group 2'),
        ('3', 'Group 3'),
        ('4', 'Group 4'),
        ('All', 'All Groups'),
    )
    name = models.CharField(max_length=50, choices=GROUP_CHOICES)
    description = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name
############################################ Group ############################################


############################################ Companies ############################################
class Company(models.Model):
    company_id = models.CharField(max_length=15, unique=True)
    is_active = models.BooleanField(default=True)
    name = models.CharField(max_length=200)
    owner_name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200)
    phone = models.CharField(max_length=15)
    industry = models.CharField(max_length=200)
    company_size = models.CharField(max_length=50)
    description = models.TextField(max_length=500)
    founding_date = models.DateField(null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    address = models.CharField(max_length=200)
    city = models.CharField(max_length=200)
    state = models.CharField(max_length=50)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.founding_date:
            today = date.today()
            self.age = today.year - self.founding_date.year - ((today.month, today.day) < (self.founding_date.month, self.founding_date.day))
        super(Company, self).save(*args, **kwargs)
############################################ Companies ############################################


############################################ Mentors ############################################
class Mentor(models.Model):
    name = models.CharField(max_length=200, unique=True)
    expertise = models.CharField(max_length=200)
    bio = models.TextField(max_length=3000, blank=True, null=True)
    phone = models.CharField(max_length=11)
    email = models.EmailField(max_length=200)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, blank=True, null=True)
    companies_assigned = models.IntegerField(null=True, blank=True)
    total_hours = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.group:
            self.companies_assigned = Company.objects.filter(group=self.group).count()
        else:
            self.companies_assigned = 0

        super(Mentor, self).save(*args, **kwargs)
############################################ Mentors ############################################


############################################ Mentorship Sessions ############################################
class MentorshipSession(models.Model):
    mentor = models.ForeignKey(Mentor, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    topics_covered = models.TextField(max_length=300)
    session_notes = models.TextField(max_length=4000)
    action_items = models.TextField(max_length=4000)
    duration = models.FloatField(null=True, blank=True)

    SESSION_FEEDBACK_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    )
    punctuality = models.CharField(max_length=50, choices=SESSION_FEEDBACK_CHOICES)
    engagement = models.CharField(max_length=50, choices=SESSION_FEEDBACK_CHOICES)

    def __str__(self):
        return f"Mentorship Session - {self.company.name}"

    def clean(self):
        super().clean()
        if self.date and self.date > date.today():
            raise ValidationError("The session date cannot be in the future.")
############################################ Mentorship Sessions ############################################
