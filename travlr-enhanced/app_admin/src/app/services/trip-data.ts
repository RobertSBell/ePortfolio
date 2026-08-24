import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AuthResponse } from '../models/auth-response';
import { User } from '../models/user';
import { BROWSER_STORAGE } from '../storage';
import { Trip } from '../models/trip';

@Injectable({
  providedIn: 'root'
})
export class TripData {

    constructor(
        private http: HttpClient,
        @Inject(BROWSER_STORAGE) private storage: Storage
    ) {}

    baseUrl = 'http://localhost:3000/api';

    private getAuthHeaders(): HttpHeaders {
        const token = this.storage.getItem('travlr-token');

        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    // Get all trips from the API
    getTrips(): Observable<Trip[]> {
        return this.http.get<any[]>(`${this.baseUrl}/trips`).pipe(
            map(trips => trips.map(trip => ({
                ...trip,
                start: new Date(trip.start),
                end: new Date(trip.end),
                length: Number(trip.length),
                perPerson: Number(
                    typeof trip.perPerson === 'object'
                        ? trip.perPerson.$numberDecimal
                        : trip.perPerson
                )
            })))
        );
    }

    // Add a new trip
    addTrip(formData: Trip): Observable<Trip> {

        const data = {
            ...formData,
            start: new Date(formData.start),
            end: formData.end ? new Date(formData.end) : undefined,
            length: Number(formData.length),
            perPerson: Number(formData.perPerson),
            starRating: formData.starRating != null ? Number(formData.starRating) : undefined
        };

        return this.http.post<Trip>(
            `${this.baseUrl}/trips`,
            data,
            {
                headers: this.getAuthHeaders()
            }
        );
    }

    // Get a specific trip
    getTrip(tripCode: string): Observable<Trip> {
        return this.http.get<any>(
            `${this.baseUrl}/trips/${tripCode}`
        ).pipe(
            map(trip => ({
                ...trip,
                start: new Date(trip.start),
                end: new Date(trip.end),
                length: Number(trip.length),
                perPerson: Number(
                    typeof trip.perPerson === 'object'
                        ? trip.perPerson.$numberDecimal
                        : trip.perPerson
                ),
                starRating: trip.starRating != null ? Number(trip.starRating) : undefined
            }))
        );
    }

    // Update a specific trip
    updateTrip(tripCode: string, formData: Trip): Observable<Trip> {

        const data = {
            ...formData,
            start: new Date(formData.start),
            end: formData.end ? new Date(formData.end) : undefined,
            length: Number(formData.length),
            perPerson: Number(formData.perPerson)
        };

        return this.http.put<Trip>(
            `${this.baseUrl}/trips/${tripCode}`,
            data,
            {
                headers: this.getAuthHeaders()
            }
        );
    }

    // Call to our /login endpoint, returns JWT
    login(user: User, passwd: string): Observable<AuthResponse> {
        return this.handleAuthAPICall('login', user, passwd);
    }

    // Call to our /register endpoint, creates user and returns JWT
    register(user: User, passwd: string): Observable<AuthResponse> {
        return this.handleAuthAPICall('register', user, passwd);
    }

    // Helper method for login and registration
    handleAuthAPICall(
        endpoint: string,
        user: User,
        passwd: string
    ): Observable<AuthResponse> {

        const formData = {
            name: user.name,
            email: user.email,
            password: passwd
        };

        return this.http.post<AuthResponse>(
            this.baseUrl + '/' + endpoint,
            formData
        );
    }
}