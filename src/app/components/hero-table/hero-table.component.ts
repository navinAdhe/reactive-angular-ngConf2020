import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Hero, HeroService } from '../../services/hero.service';
import { map, withLatestFrom } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
    selector: 'rx-hero-table',
    template: `
        <ng-container *ngIf="vm$ | async as vm">
            <div class="tool-bar">
                <span class="search-tool">
                    <label for="herosearch">Search: </label>
                    <input
                        name="herosearch"
                        [value]="vm.search"
                        (input)="setSearch($event.target.value)"
                    />
                </span>
                <span class="page-tool">
                    <label
                        >Page {{ vm.userPage }} of {{ vm.totalPages }} :
                    </label>
                    <span class="buttons">
                        <button
                            class="prev"
                            [disabled]="vm.userPage === 1"
                            (click)="movePageBy(-1)"
                        >
                            Prev
                        </button>
                        <button
                            class="next"
                            [disabled]="vm.isLastPage"
                            (click)="movePageBy(1)"
                        >
                            Next
                        </button>
                    </span>
                </span>
                <span class="result-tool">
                    <label>Show Results: </label>
                    <span class="buttons" *ngIf="vm.limit as currentLimit">
                        <button
                            *ngFor="let limit of hero.limits"
                            [disabled]="limit === currentLimit"
                            (click)="setLimit(limit)"
                        >
                            {{ limit }}
                        </button>
                    </span>
                </span>
                <span class="total-tool">
                    <label>Total Results: {{ vm.totalHeroes }}</label>
                </span>
            </div>
            <div class="table-content" *ngIf="vm.heroes as heroes">
                <rx-hero-badge
                    *ngFor="let hero of heroes"
                    [hero]="hero"
                ></rx-hero-badge>
            </div>
        </ng-container>
    `,
    styleUrls: ['./hero-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroTableComponent implements OnInit {
    // heroes: Hero[];
    // userPage$ = this.hero.page$.pipe(map(page => page+1))

    // isLastPage$ = this.hero.totalPages$.pipe(
    //     withLatestFrom(this.userPage$),
    //     map(([total, userPage]) => total === userPage));

    // view model
    vm$ = combineLatest([
        this.hero.heroes$,
        this.hero.totalHeroes$,
        this.hero.totalPages$,
    ]).pipe(
        withLatestFrom(this.hero.search$, this.hero.page$, this.hero.limit$),
        map(([[heroes, totalHeroes, totalPages], search, page, limit]) => ({
            search,
            limit,
            heroes,
            totalHeroes,
            totalPages,
            userPage: page + 1,
            isLastPage: totalHeroes === page + 1,
        })),
    );

    constructor(public hero: HeroService) {
        // Use the async pipe in the template and let angular subscribe for you.
        // hero.heroes$.subscribe(heroes => {
        //     this.heroes = heroes;
        // });
    }

    movePageBy(noOfPages) {
        this.hero.movePageBy(noOfPages);
    }

    setLimit(limit) {
        this.hero.setLimit(limit);
    }

    setSearch(searchTerm) {
        this.hero.setSearch(searchTerm);
    }

    ngOnInit() {}
}
