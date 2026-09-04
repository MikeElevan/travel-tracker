import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { Photo, Place, PlaceDetails, Tip } from '../models/place.model';

interface SearchResponse { results: Place[]; }
export type SearchLocation = { kind: 'near'; near: string } | { kind: 'coords'; latitude: number; longitude: number };
const CACHE_TTL_MS = 10 * 60 * 1000;
const AUTOCOMPLETE_API_VERSION = '2025-06-17';

export interface AutocompletePlaceResult { type: 'place'; place: Place; }
export interface AutocompleteGeoResult { type: 'geo'; geo: any; }
export interface AutocompleteSearchResult { type: 'search'; search: any; }
export type AutocompleteResult = AutocompletePlaceResult | AutocompleteGeoResult | AutocompleteSearchResult;
interface AutocompleteResponse { results: AutocompleteResult[]; }

@Injectable({ providedIn: 'root' })
export class PlacesApiService {
  private readonly baseUrl = environment.foursquareBaseUrl;
  private readonly autocompleteBaseUrl = environment.foursquareAutocompleteUrl;
  
  private readonly baseHeadersConfig = {
    'Authorization': environment.foursquareApiKey,
    'Accept': 'application/json'
  };

  constructor(private readonly http: HttpClient, private readonly cache: CacheService) {}

  searchPlaces(query: string, location: SearchLocation, sessionToken?: string): Observable<Place[]> {
    const cleanQuery = query ? query.trim() : '';
    if (cleanQuery.length < 3) return of([]);

    const autocompleteOptions: any = {
      limit: 30,
      types: ['place'],
      session_token: sessionToken
    };

    if (location.kind === 'coords') {
      autocompleteOptions.ll = { latitude: location.latitude, longitude: location.longitude };
    }

    return this.autocomplete(cleanQuery, autocompleteOptions).pipe(
      map((results) => {
        if (!results) return [];
        return results
          .filter((res): res is AutocompletePlaceResult => res.type === 'place')
          .map((res) => res.place);
      })
    );
  }

  autocomplete(query: string, options: any = {}): Observable<AutocompleteResult[]> {
    const cacheKey = this.buildAutocompleteKey(query, options);
    
    const autocompleteHeaders = new HttpHeaders({
      ...this.baseHeadersConfig,
      'X-Places-Api-Version': AUTOCOMPLETE_API_VERSION
    });

    let params = new HttpParams().set('query', query);
    if (options.ll) params = params.set('ll', `${options.ll.latitude.toFixed(3)},${options.ll.longitude.toFixed(3)}`);
    if (options.radius !== undefined) params = params.set('radius', options.radius.toString());
    if (options.types) params = params.set('types', Array.isArray(options.types) ? options.types.join(',') : options.types);
    if (options.bias) params = params.set('bias', options.bias);
    if (options.session_token) params = params.set('session_token', options.session_token);
    if (options.limit !== undefined) params = params.set('limit', options.limit.toString());

    return this.useCacheOrFetch(cacheKey, () =>
      this.http.get<AutocompleteResponse>(`${this.autocompleteBaseUrl}/autocomplete`, {
        headers: autocompleteHeaders,
        params
      }).pipe(
        map((response) => {
          console.log('Autocomplete results:', response.results);
          return response.results;
        })
      )
    );
  }

  getPlaceDetails(fsqId: string): Observable<PlaceDetails> {
    return of({
      fsq_place_id: fsqId,
      name: 'Mock Place',
      categories: [
        { id: 1, name: 'Restaurant', icon: { prefix: 'https://example.com/', suffix: '.png' } }
      ],
      location: {
        address: '123 Mock Street',
        locality: 'Mock City',
        region: 'Mock Region',
        country: 'Mock Country',
        formatted_address: '123 Mock Street, Mock City, Mock Region'
      },
      distance: 100,
      geocodes: { main: { latitude: 55.7558, longitude: 37.6173 } },
      rating: 8.5,
      price: 2,
      hours: { display: 'Mon-Sun: 10:00 AM - 10:00 PM', open_now: true },
      tel: '+1-555-0123',
      website: 'https://mockplace.example.com',
      description: 'This is a mock place for testing purposes.'
    });
  }

  getPlacePhotos(fsqId: string): Observable<Photo[]> {
    return of([
      {
        id: 'photo-1',
        prefix: 'https://mock-images.example.com/',
        suffix: '/photo1.jpg',
        width: 800,
        height: 600
      },
      {
        id: 'photo-2',
        prefix: 'https://mock-images.example.com/',
        suffix: '/photo2.jpg',
        width: 800,
        height: 600
      },
      {
        id: 'photo-3',
        prefix: 'https://mock-images.example.com/',
        suffix: '/photo3.jpg',
        width: 800,
        height: 600
      }
    ]);
  }

  getPlaceTips(fsqId: string): Observable<Tip[]> {
    return of([
      {
        id: 'tip-1',
        text: 'Great place to visit! Highly recommended.',
        created_at: '2025-01-15T10:30:00Z'
      },
      {
        id: 'tip-2',
        text: 'The food was amazing and the service was excellent.',
        created_at: '2025-02-20T14:45:00Z'
      },
      {
        id: 'tip-3',
        text: 'A bit crowded on weekends, but worth it.',
        created_at: '2025-03-10T09:15:00Z'
      }
    ]);
  }

  private useCacheOrFetch<T>(key: string, fetchFn: () => Observable<T>): Observable<T> {
    const cached = this.cache.get<T>(key);
    if (cached) return of(cached);
    return fetchFn().pipe(
      tap({
        next: (data) => this.cache.set(key, data, CACHE_TTL_MS),
        error: () => { }
      })
    );
  }

  private buildAutocompleteKey(query: string, options: any): string {
    const q = query.trim().toLowerCase();
    const llKey = options.ll ? `${options.ll.latitude.toFixed(3)},${options.ll.longitude.toFixed(3)}` : 'no-ll';
    const typesKey = options.types ? (Array.isArray(options.types) ? options.types.join(',') : options.types) : 'all';
    return `autocomplete:${q}:${llKey}:${options.radius ?? 'default'}:${typesKey}`;
  }
}
