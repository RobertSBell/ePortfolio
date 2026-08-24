import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { User } from '../models/user';
import { BROWSER_STORAGE } from '../storage';
import { Trip } from '../models/trip';



@Injectable({
  providedIn: 'root'
})

// TripData service handles API calls related to trips and user authentication
export class TripData {
    constructor(private http: HttpClient,
        @Inject(BROWSER_STORAGE) private storage: Storage
    ) {}
    baseUrl = 'http://localhost:3000/api';

    private getAuthHeaders(): HttpHeaders {
        const token = this.storage.getItem('travlr-token');

        console.log(token);

        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    // Get all trips from the API
    getTrips(): Observable<Trip[]> {
        return this.http.get<Trip[]>(`${this.baseUrl}/trips`);
    }

    // Add a new trip by sending a POST request to the API
    addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(
        `${this.baseUrl}/trips`,
        formData,
        {
            headers: this.getAuthHeaders()
        }
    );
}
    // Get a specific trip by its code from the API
    getTrip(tripCode: string): Observable<Trip> {
        return this.http.get<Trip>(`${this.baseUrl}/trips/${tripCode}`);
    }

    // Update a specific trip by its code by sending a PUT request to the API
    updateTrip(tripCode: string, formData: Trip): Observable<Trip> {
    return this.http.put<Trip>(
        `${this.baseUrl}/trips/${tripCode}`,
        formData,
        {
            headers: this.getAuthHeaders()
        }
    );
}

    // Call to our /login endpoint, returns JWT
    login(user: User, passwd: string) : Observable<AuthResponse> {
        // console.log('Inside TripDataService::login');
        return this.handleAuthAPICall('login', user, passwd);
    }

    // Call to our /register endpoint, creates user and returns JWT
    register(user: User, passwd: string) : Observable<AuthResponse> {
        // console.log('Inside TripDataService::register');
        return this.handleAuthAPICall('register', user, passwd);
    }

    // helper method to process both login and register methods
    handleAuthAPICall(endpoint: string, user: User, passwd: string) :
        Observable<AuthResponse> {
            // console.log('Inside TripDataService::handleAuthAPICall');
            let formData = {
                name: user.name,
                email: user.email,
                password: passwd
            };
            return this.http.post<AuthResponse>(this.baseUrl + '/' + endpoint,
            formData);
        }
}