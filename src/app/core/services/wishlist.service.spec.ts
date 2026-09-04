import { TestBed } from '@angular/core/testing';
import { WishlistService } from './wishlist.service';
import { Place } from '../models/place.model';

describe('WishlistService', () => {
  let service: WishlistService;
  const STORAGE_KEY = 'travel-tracker:wishlist';

  const mockPlace: Place = {
    fsq_place_id: 'test-123',
    name: 'Test Place',
    categories: [{ id: 1, name: 'Cafe', icon: { prefix: 'http://', suffix: '.png' } }],
    location: { address: 'Test Street' },
    geocodes: { main: { latitude: 55.7558, longitude: 37.6173 } }
  };

  const mockPlace2: Place = {
    fsq_place_id: 'test-456',
    name: 'Another Place',
    categories: [{ id: 2, name: 'Museum', icon: { prefix: 'http://', suffix: '.png' } }],
    location: { address: 'Another Street' },
    geocodes: { main: { latitude: 55.7558, longitude: 37.6173 } }
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [WishlistService]
    });
    service = TestBed.inject(WishlistService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty items', () => {
    expect(service.items()).toEqual([]);
    expect(service.count()).toBe(0);
  });

  it('should add a place to wishlist', () => {
    service.add(mockPlace);
    
    expect(service.items().length).toBe(1);
    expect(service.items()[0].place.fsq_place_id).toBe('test-123');
    expect(service.count()).toBe(1);
  });

  it('should not add duplicate places', () => {
    service.add(mockPlace);
    service.add(mockPlace);
    
    expect(service.items().length).toBe(1);
    expect(service.count()).toBe(1);
  });

  it('should check if place is in wishlist', () => {
    service.add(mockPlace);
    
    expect(service.isInWishlist('test-123')).toBeTrue();
    expect(service.isInWishlist('non-existent')).toBeFalse();
  });

  it('should remove a place from wishlist', () => {
    service.add(mockPlace);
    service.add(mockPlace2);
    service.remove('test-123');
    
    expect(service.items().length).toBe(1);
    expect(service.items()[0].place.fsq_place_id).toBe('test-456');
    expect(service.count()).toBe(1);
  });

  it('should toggle place in wishlist', () => {
    service.toggle(mockPlace);
    expect(service.isInWishlist('test-123')).toBeTrue();
    
    service.toggle(mockPlace);
    expect(service.isInWishlist('test-123')).toBeFalse();
  });

  it('should persist to localStorage', () => {
    service.add(mockPlace);
    
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].place.fsq_place_id).toBe('test-123');
  });

  it('should load from localStorage on init', () => {
    const savedItems = [{ place: mockPlace, addedAt: Date.now() }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    
    const newService = new WishlistService();
    expect(newService.items().length).toBe(1);
    expect(newService.items()[0].place.fsq_place_id).toBe('test-123');
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json');
    spyOn(console, 'error');
    
    const newService = new WishlistService();
    expect(newService.items()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should add timestamp when adding place', () => {
    const beforeAdd = Date.now();
    service.add(mockPlace);
    const afterAdd = Date.now();
    
    const addedAt = service.items()[0].addedAt;
    expect(addedAt).toBeGreaterThanOrEqual(beforeAdd);
    expect(addedAt).toBeLessThanOrEqual(afterAdd);
  });

  it('should handle multiple places', () => {
    service.add(mockPlace);
    service.add(mockPlace2);
    
    expect(service.count()).toBe(2);
    expect(service.isInWishlist('test-123')).toBeTrue();
    expect(service.isInWishlist('test-456')).toBeTrue();
  });
});