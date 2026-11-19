# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Google Maps key

The property detail page embeds a map with the Google Maps Embed API. Copy
`.env.example` to `.env` and paste a key that is restricted to
`localhost:3000` and the Maps Embed API:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
```

Restart `npm start` after editing `.env`. Without a key the detail page still
works; it shows a note in place of the map and keeps the Get Directions link.

## Sorting the listings

The "Sort by" control under the filters sends `sortBy` and `sortOrder` to
`GET /api/properties`. `sortBy` values are the real column names in
`rets_property` — `L_SystemPrice`, `ListingContractDate`, `LM_Int2_3`,
`L_Keyword2` — and `sortOrder` is `asc` or `desc`. Anything else is a 400, which
is why the picker's values in `src/components/SortControls.js` must stay in step
with the whitelist in `backend/src/propertyQuery.js`.

Sorting resets to page 1 and is kept while paging, but a new filter search (or
Clear Filters) returns to the default order. Rows that have no value for the
sorted column are left out of a sorted result, so the "Showing X of Z" total
matches the rows you can actually order.

Sorting reads an index per column. If price sorting feels slow on a fresh
database, add the indexes in `backend/sql/indexes.sql`.

## Favorites

Each property card has a heart button, and the header links to `/favorites` with
a count of what is saved. Favorites live in the browser: `useFavorites`
(`src/hooks/useFavorites.js`) keeps them under the `idx.favorites` localStorage
key, so they survive a refresh and are per device, per browser — nothing is sent
to the API and there is no account to sign in to.

A saved entry stores the card snapshot (address, price, beds, baths, square
footage, status, photos) rather than only an id. That keeps the favorites page
instant and lets it show properties that are no longer in the current set of
results.

One store backs every consumer, so saving from a card updates the count in the
header and the favorites page at the same time. Changes made in another tab are
picked up through the `storage` event.

## When something goes wrong

A render error anywhere in the app shows a recovery panel — "Something went wrong"
with a **Try again** button and a link back to the listings — instead of a blank
white page. `src/components/ErrorBoundary.js` is mounted twice: once around the
router in `src/index.js` and once inside it in `src/App.js`, so a crash in the
listings can no longer take the header or navigation down with it. Saved
favorites are in localStorage and survive the crash.

The bundle is warning-clean. The React Router v7 future flags
(`v7_startTransition`, `v7_relativeSplatPath`) are switched on where the router is
created, in `App.js` and in the test renders, which is why `npm test` prints no
`Future Flag Warning` or `not wrapped in act(...)` lines.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
