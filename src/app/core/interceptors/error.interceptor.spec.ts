import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should handle network error (status 0)', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Нет подключения к сети');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.error(new ProgressEvent('error'), { status: 0 });
  });

  it('should handle 400 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Некорректный запрос');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle 401 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Ошибка авторизации');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 403 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Доступ запрещён');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 403, statusText: 'Forbidden' });
  });

  it('should handle 404 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Ресурс не найден');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('should handle 429 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Слишком много запросов');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 429, statusText: 'Too Many Requests' });
  });

  it('should handle 500 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Ошибка сервера');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle 503 error', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Сервис временно недоступен');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 503, statusText: 'Service Unavailable' });
  });

  it('should handle unknown error status', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.message).toContain('Ошибка 418');
      }
    });

    const req = httpTestingController.expectOne('/test');
    req.flush(null, { status: 418, statusText: "I'm a teapot" });
  });
});