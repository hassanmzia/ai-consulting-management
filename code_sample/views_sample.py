from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Avg, Count, Min, Max
from datetime import date
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import Company, Group, Mentor, Indicator
from .forms import CompanyForm, IndicatorForm
from .decorators import role_required

############################################ Companies ############################################
@login_required
@role_required('Mentor', 'Consultant')
def companies_list(request):
    """View to list all companies."""
    companies = Company.objects.all()
    return render(request, 'dashboard/companies_list.html', {'companies': companies})

@login_required
@role_required('Mentor')
def companies_create(request):
    """View to create a new company."""
    form = CompanyForm(request.POST or None)
    if form.is_valid():
        form.save()
        messages.success(request, "Company successfully created!")
        return redirect('dashboard:companies_list')
    return render(request, 'dashboard/companies_form.html', {'form': form})

@login_required
@role_required('Mentor')
def companies_update(request, id):
    """View to update an existing company."""
    company = get_object_or_404(Company, id=id)
    form = CompanyForm(request.POST or None, instance=company)
    if form.is_valid():
        form.save()
        messages.success(request, "Company details updated successfully!")
        return redirect('dashboard:companies_list')
    return render(request, 'dashboard/companies_form.html', {'form': form, 'company': company})

@login_required
@role_required('Mentor', 'Consultant')
def companies_summary(request):
    """View to generate a summary of companies based on various metrics."""
    companies = Company.objects.all()
    
    total_companies = companies.count()
    avg_age = companies.aggregate(Avg('age'))['age__avg']
    youngest_age = companies.aggregate(Min('age'))['age__min']
    oldest_age = companies.aggregate(Max('age'))['age__max']
    
    companies_by_city = companies.values('city').annotate(total=Count('id')).order_by('city')
    companies_by_sector = companies.values('industry').annotate(total=Count('id')).order_by('industry')

    context = {
        'total_companies': total_companies,
        'avg_age': avg_age,
        'youngest_age': youngest_age,
        'oldest_age': oldest_age,
        'companies_by_city': companies_by_city,
        'companies_by_sector': companies_by_sector,
    }
    
    return render(request, 'dashboard/companies_summary.html', context)

@login_required
@role_required('Mentor', 'Consultant')
def companies_detail(request, id):
    """View to show details of a single company."""
    company = get_object_or_404(Company, pk=id)
    return render(request, 'dashboard/companies_detail.html', {'company': company})

############################################ Indicators ############################################
@login_required
@role_required('Mentor', 'Consultant')
def indicators_list(request):
    """View to list all indicators."""
    indicators = Indicator.objects.all()
    return render(request, 'dashboard/indicators_list.html', {'indicators': indicators})

@login_required
@role_required('Mentor')
def indicators_create(request):
    """View to create a new performance indicator."""
    form = IndicatorForm(request.POST or None)
    if form.is_valid():
        form.save()
        messages.success(request, "Indicator added successfully!")
        return redirect('dashboard:indicators_list')
    return render(request, 'dashboard/indicators_form.html', {'form': form})

@login_required
@role_required('Mentor', 'Consultant')
def indicators_summary(request):
    """View to generate an analysis of indicator performance across companies."""
    indicators = Indicator.objects.all()
    
    indicators_summary = indicators.values('category').annotate(
        avg_score=Avg('score'), 
        min_score=Min('score'), 
        max_score=Max('score')
    ).order_by('category')

    context = {
        'indicators_summary': indicators_summary
    }

    return render(request, 'dashboard/indicators_summary.html', context)

