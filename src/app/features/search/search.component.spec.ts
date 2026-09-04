import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { SearchComponent } from './search.component';
import { PlacesApiService } from '../../core/services/places-api.service';
import { Place } from '../../core/models/place.model';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let placesApiSpy: jasmine.SpyObj<PlacesApiService>;

  const mockPlaces: Place[] = [
    {
      fsq_place_id: '1',
      name: 'Test Cafe',
      categories: [{ id: 1, name: 'Cafe', icon: { prefix: 'http://', suffix: '.png' } }],
      location: { address: 'Test Street' },
      geocodes: { main: { latitude: 55.7558, longitude: 37.6173 } }
    }
  ];

  beforeEach(async () => {
    placesApiSpy = jasmine.createSpyObj('PlacesApiService', ['searchPlaces']);
    placesApiSpy.searchPlaces.and.returnValue(of(mockPlaces));

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, SearchComponent],
      providers: [
        FormBuilder,
        { provide: PlacesApiService, useValue: placesApiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty results initially', () => {
    expect(component.places()).toEqual([]);
    expect(component.loading()).toBeFalse();
  });

  it('should debounce search input', fakeAsync(() => {
    component.usingGeolocation.set(true);
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('caf');
    
    tick(100);
    expect(placesApiSpy.searchPlaces).not.toHaveBeenCalled();
    
    tick(400);
    expect(placesApiSpy.searchPlaces).toHaveBeenCalled();
  }));

  it('should not search on rapid typing', fakeAsync(() => {
    component.usingGeolocation.set(true);
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    
    queryControl.setValue('c');
    tick(100);
    queryControl.setValue('co');
    tick(100);
    queryControl.setValue('cof');
    tick(100);
    queryControl.setValue('coff');
    tick(100);
    queryControl.setValue('coffe');
    tick(100);
    queryControl.setValue('coffee');
    
    tick(500);
    expect(placesApiSpy.searchPlaces).toHaveBeenCalledTimes(1);
  }));

  it('should cancel previous request on new input', fakeAsync(() => {
    component.usingGeolocation.set(true);
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('coffee');
    tick(500);
    
    queryControl.setValue('cafe');
    tick(500);
    
    expect(placesApiSpy.searchPlaces).toHaveBeenCalledTimes(2);
  }));

  it('should set loading state during search', fakeAsync(() => {
    component.usingGeolocation.set(true);
    const searchSubject = new Subject<Place[]>();
    placesApiSpy.searchPlaces.and.returnValue(searchSubject.asObservable());
    
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('coffee');
    tick(500);
    
    expect(component.loading()).toBeTrue();
    
    searchSubject.next(mockPlaces);
    searchSubject.complete();
    tick();
    
    expect(component.loading()).toBeFalse();
  }));

  it('should update places on successful search', fakeAsync(() => {
    component.usingGeolocation.set(true);
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('coffee');
    tick(500);
    fixture.detectChanges();
    
    expect(component.places().length).toBeGreaterThan(0);
    expect(component.places()[0]).toEqual(mockPlaces[0]);
  }));

  it('should handle search error', fakeAsync(() => {
    component.usingGeolocation.set(true);
    placesApiSpy.searchPlaces.and.throwError('API Error');
    
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('coffee');
    tick(500);
    
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  }));

  it('should not search with empty query', fakeAsync(() => {
    component.usingGeolocation.set(true);
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('');
    tick(500);
    
    expect(placesApiSpy.searchPlaces).not.toHaveBeenCalled();
  }));

  it('should track when results come from cache', fakeAsync(() => {
    component.usingGeolocation.set(true);
    fixture.detectChanges();
    
    const queryControl = component.form.get('query')!;
    queryControl.setValue('coffee');
    tick(500);
    
    expect(component.fromCache()).toBeTrue();
  }));
});