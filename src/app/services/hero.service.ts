import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import {
    map,
    distinctUntilChanged,
    pluck,
    switchMap,
    debounceTime,
    shareReplay,
    tap,
    withLatestFrom,
} from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Hero {
    id: number;
    name: string;
    description: string;
    thumbnail: HeroThumbnail;
    resourceURI: string;
    comics: HeroSubItems;
    events: HeroSubItems;
    series: HeroSubItems;
    stories: HeroSubItems;
}

export interface HeroThumbnail {
    path: string;
    extendion: string;
}

export interface HeroSubItems {
    available: number;
    returned: number;
    collectionURI: string;
    items: HeroSubItem[];
}

export interface HeroSubItem {
    resourceURI: string;
    name: string;
}

// The URL to the Marvel API
const HERO_API = `${environment.MARVEL_API.URL}/v1/public/characters`;

// Our Limits for Search
const LIMIT_LOW = 10;
const LIMIT_MID = 25;
const LIMIT_HIGH = 100;
const LIMITS = [LIMIT_LOW, LIMIT_MID, LIMIT_HIGH];

interface HeroState {
    search: string;
    page: number;
    limit: number;
    loading: boolean;
}

const initialState = {
    search: '',
    page: 0,
    limit: LIMIT_LOW,
    loading: false,
};

interface HeroResponse {
    data: {
        total: number;
        results: Hero[];
    };
}

@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;

    private heroState$: BehaviorSubject<HeroState> = new BehaviorSubject(
        initialState,
    );

    search$ = this.heroState$.pipe(
        pluck('search'),
        distinctUntilChanged(),
    );
    page$ = this.heroState$.pipe(
        pluck('page'),
        distinctUntilChanged(),
    );
    limit$ = this.heroState$.pipe(
        pluck('limit'),
        distinctUntilChanged(),
    );
    loading$ = this.heroState$.pipe(
        pluck('loading'),
        distinctUntilChanged(),
    );

    private params$ = combineLatest([this.search$, this.page$, this.limit$]);

    heroesResponse$: Observable<HeroResponse> = this.params$.pipe(
        debounceTime(100),
        tap(() => this.toggelLoading(true)),
        switchMap(([search, page, limit]) => {
            const params: any = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`, // page * limit
            };

            if (search && search.length) {
                params.nameStartsWith = search;
            }

            return this.http.get<HeroResponse>(HERO_API, { params });
        }),
        tap(() => this.toggelLoading(false)),
        shareReplay(1),
    );

    heroes$: Observable<Hero[]> = this.heroesResponse$.pipe(
        pluck('data', 'results'),
    );

    totalHeroes$: Observable<number> = this.heroesResponse$.pipe(
        pluck('data', 'total'),
    );
    totalPages$ = this.totalHeroes$.pipe(
        withLatestFrom(this.limit$),
        map(([total, limit]) => Math.ceil(total / limit)),
    );

    constructor(private http: HttpClient) {}

    private toggelLoading(loading) {
        const state = this.heroState$.getValue();
        this.heroState$.next({
            ...state,
            loading,
        });
    }

    setLimit(limit) {
        const state = this.heroState$.getValue();
        this.heroState$.next({
            ...state,
            page: 0,
            limit,
        });
    }

    setSearch(searchTerm) {
        const state = this.heroState$.getValue();
        this.heroState$.next({
            ...state,
            page: 0,
            search: searchTerm,
        });
    }

    movePageBy(noOfPages) {
        const state = this.heroState$.getValue();
        this.heroState$.next({
            ...state,
            page: state.page + noOfPages,
        });
    }
}
