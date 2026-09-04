import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService]
    });
    service = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null for non-existent key', () => {
    expect(service.get('non-existent')).toBeNull();
  });

  it('should store and retrieve data', () => {
    service.set('key1', { name: 'test' });
    const result = service.get<{ name: string }>('key1');
    expect(result).toEqual({ name: 'test' });
  });

  it('should return null after TTL expires', fakeAsync(() => {
    service.set('key1', 'data', 1000);
    expect(service.get('key1')).toBe('data');
    
    tick(1001);
    expect(service.get('key1')).toBeNull();
  }));

  it('should check if key exists', () => {
    service.set('key1', 'data');
    expect(service.has('key1')).toBeTrue();
    expect(service.has('non-existent')).toBeFalse();
  });

  it('should invalidate specific key', () => {
    service.set('key1', 'data1');
    service.set('key2', 'data2');
    
    service.invalidate('key1');
    
    expect(service.has('key1')).toBeFalse();
    expect(service.has('key2')).toBeTrue();
  });

  it('should clear all entries', () => {
    service.set('key1', 'data1');
    service.set('key2', 'data2');
    
    service.clear();
    
    expect(service.has('key1')).toBeFalse();
    expect(service.has('key2')).toBeFalse();
  });

  it('should expire after custom TTL', fakeAsync(() => {
    service.set('key1', 'data', 5000);
    expect(service.get('key1')).toBe('data');
    
    tick(5000);
    expect(service.get('key1')).toBe('data');
    
    tick(1);
    expect(service.get('key1')).toBeNull();
  }));

  it('should overwrite existing key', () => {
    service.set('key1', 'old-data');
    service.set('key1', 'new-data');
    expect(service.get('key1')).toBe('new-data');
  });

  it('should handle different data types', () => {
    service.set('string', 'text');
    service.set('number', 42);
    service.set('array', [1, 2, 3]);
    service.set('object', { nested: { value: true } });

    expect(service.get('string')).toBe('text');
    expect(service.get('number')).toBe(42);
    expect(service.get('array')).toEqual([1, 2, 3]);
    expect(service.get('object')).toEqual({ nested: { value: true } });
  });
});