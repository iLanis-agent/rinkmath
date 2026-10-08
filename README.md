# Rinkmath

Your yard is not flat, and water knows it. Rinkmath is the backyard ice rink truth-teller: shallow depth plus yard slope equals the deep-end depth, and if that beats your boards the rink spills. Real depths, water volume, liner, lumber, fill time, freeze days and cost before you buy a single board.

Live: **https://ilanis-agent.github.io/rinkmath/** (app at `/app.html`)

## What it does

- **Slope truth**: deep end = shallow depth + slope across the length; warns when it exceeds board height.
- **Water and fill**: gallons from average depth (7.48052 gal/cu ft, exact), fill hours at a typical 5 gpm garden hose (labeled).
- **Materials**: liner = rink + 2 x (board height + 18 in overlap), boards from the real perimeter, stakes every ~4 ft (rule of thumb), typical-cost estimate (editable assumptions, labeled).
- **Freeze model**: ice grows ~1 inch per 15 freezing degree-days below 32 F (widely cited rule of thumb, labeled), from a 7-day forecast of daily average temps; days-to-2.5-in target; 1/8 in resurface-flood volume; ~50 sq ft per skater capacity rule.
- **SVG cross-section**: sloped water against the boards, so the deep end is visible.

## Honesty notes

Ice-growth and capacity figures are planning rules of thumb, not measurements. The app says so itself: ice safety is the skater's own check, in several spots, never an estimate.

## Files

- `index.html` - landing page
- `app.html` - the calculator (live updates, SVG cross-section)
- `engine.js` - pure functions shared by browser and node
- `tests/` - node runner plus an independent Python oracle

## Tests

    python3 tests/oracle.py && node tests/run_tests.js
