# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.16.3] - 2025-06-13
### Fixed
- closes #236; include annotations in docker image build step
- closes #235; missing state, should now work with Authelia

## [0.16.2] - 2025-06-01
### Fixed
- closes #234; oidc flow cannot start when popups are blocked

## [0.16.1] - 2025-05-31
### Fixed
- closes #233; oidc flow cannot start on ios

## [0.16.0] - 2025-05-30
### Added
- closes #223; SSO via external OIDC providers
### Changes
- require go 1.24
- closes #225; remove api picker from frontend
- closes #226; migrate to pnpm instead of npm
- replace all PATCH methods with PUT
- update to es2020
- general code tidying
### Fixed
- fix error when loading a user with no books

## [0.15.4] - 2025-04-19
### Fixed
- #231; double braces cannot be escape (only temporary fix)

## [0.15.3] - 2025-03-28
### Changed
- #221; Specify tooling used in package.json
### Fixed
- #227; scratchpad crashes when loading rendered view
- #228; print feature crashes app

## [0.15.2] - 2025-03-08
### Changed
- Update frontend deps to solve potential security issue

## [0.15.1] - 2025-01-19
### Fixed
- #219; conflict detection not working
### Changed
- Update dependencies
- Require a minimum of go 1.23.0

## [0.15.0] - 2024-12-07
### Fixed
- #217; re-login button not available on homepage
### Added
- #213; syntax highlighting in code blocks
- RFC 9457 support for API requests
- Configurable find user capability
- Preventions for possible note content collisions
- Basic templating in note content, for future expansion
### Changed
- Rewrite backend to use huma
- Update dependencies

## [0.14.1] - 2024-09-25
### Fixed
- Fix #210; cannot add new users

## [0.14.0] - 2024-09-23
### Added
- #207; vim mode for editor
### Changed
- Update frontend and docker versions
- Refactor backend to make a future update easier
- Require go 1.22 for backend
- Make cursor easier to see
- Keep editor settings for current session
### Fixed
- #206; copy to clipboard does not work on all browsers

## [0.13.1] - 2024-07-28
### Fixed
- fixed XSS vulnerability

## [0.13.0] - 2024-05-11
### Added
- Data import/export via CLI
### Fixed
- Better styling on mobile in portrait mode
- #89; Changing tab with unsaved changes causes data-loss

## [0.12.2] - 2024-04-13
### Changed
- Prevent app from starting if static directory does not exist, if one has been set
### Fixed
- #195; cannot update user profile
- #191; attachments cannot be opened

## [0.12.1] - 2024-03-28
### Changed
- Add users name if set on their area homepage
### Fixed
- #118; Drawer fails to load on certain browsers
- #189; Dropdown hidden by editor toolbar

## [0.12.0] - 2024-03-26
### Added
- Search for notes & books
### Changed
- All user, notebook & notes data in drawer is now loaded together in one request
- Indentation control in editor can now be used via `<tab>` and `<shift><tab>`, thanks @RobViren
- Optimised routes
    - Reducing the amount of requests needed
    - Reduce the need to get things via their slug's, using item ids instead
### Fixed
- Table no-longer takes up 100% of the width, unless it's needed
- Editor UI improvements/fixes
- Autocomplete for username & password change form
### Security
- Validation for if user still exists when authentication token is still valid)

## [0.11.1] - 2024-02-01
### Fixed
- #181; Can't create notebook when one does not already exist
- Missing background blur on editor toolbar

## [0.11.0] - 2024-01-31
### Added
- Print note
- Download note
- Better header/footer consistency
- #178; button to copy note to clipboard
- #175; clickable breadcrumbs
- Scratchpad for temporary note making (local to device)
### Changed
- Enhanced pre-login step
- Redesigned profile & homepage
### Fixed
- Minor styling issues

## [0.10.0] - 2023-12-27
### Added
- All-in-one docker image, highly requested feature to make deployment easier
- Recent notes are now on the home screen
- Note assets, upload and use assets in your notes
- User management via CLI
### Changed
- Fully featured editor toolbar, now also follows you down the page
- Update Docker image versions
- New syntax highlighting for markdown editor
### Fixed
- Ensure some fields never get converted to JSON
- Ensure every time a note is modified the updated time is changed

## [0.9.0] - 2023-11-20
### Added
- Add ability to put current note in full-screen
### Changed
- Combine notebook & notes into a tree view
- Bump deps
### Fixed
- On note restore bring back to drawer
- Caching fixes

## [0.8.0] - 2023-10-21
### Added
- More icons!
- Copy link button
- Implement basic service worker for future offline functionality (PWA)
- Keep current note mode for session
- More intelligent caching (E-Tag & Last-Modified)
### Changed
- Use drop-down for note/notebook management
- Code optimisation
- Better breadcrumb view-ability on small devices
- Update dependency versions

## [0.7.0] - 2023-09-11
### Added
- #94; note and book sorting
- shortcut to save with MOD+S
### Changed
- WASM markdown rendering (performance improvement)
- better dialog accessibility
- loading improvements
- soft-delete notebooks for future feature
- #91; notes and books now have a small random suffix for slug on creation
- editor will now be focused on load
- auto-save can now be toggled on and off
- clearer message on login & signup pages when api has not been set
### Fixed
- prevent infinite re-loading if api cannot be accessed
- #91; report SQL errors correctly
- #88; todo spacing
- drawer not always being on top

## [0.6.0] - 2023-09-08
### Added
- proper docs for deployment
### Changed
- bump deps to latest
- ui improvements
- better re-login flow
### Fixed
- Empty note handling on ui
- ensure correct link is handled in drawer
### Removed
- MySQL and MariaDB support

## [0.6.0-alpha.4] - 2023-07-10
### Added
- public viewing of books & notes
- note soft+hard deletion & restore
- cleanup tool
- new cli
### Changed
- bump deps
- enabled spellchecker in editor
- more loading spinners for certain things
- modals now use html 'dialog' element, improving accessibility

## [0.6.0-alpha.3] - 2023-06-12
### Added
- ability to change password
- api server validation on load and when set
- profile page
- admin can disable new account creation
### Changed
- markdown will now be rendered in the client (allowing for future offline functionality...)
- remove trailing slash on api routes, why were they there in the first place?
- use only feathericons for icons
- migrate to daisyui V3
- disable editor button when user does not have permission
- disk storage folder structure uses 2 characters instead of 3
- update deps
- add lockfile ensuring app always gets built consistently
### Fixed
- disable buttons when required
- don't create api object each time it's used
- fix book slug query (stopped app from working when there is no content
### Removed
- server side markdown rendering

## [0.6.0-alpha.2] - 2023-05-28
### Added
- theme picker to choose between light/dark themes
- error handling for frontend
- ability to push "toasts" to screen
- user search functionality (to access public notebooks)
### Changed
- improved loading screens
- support for GFM (GitHub flavoured markdown)
- tab to toggle between rendered and raw view
### Fixed
- arm64 & amd64 docker image (was broken)
- disable edit screen when viewing a read-only notebook/note

## [0.6.0-alpha] - 2023-05-26
### Changed
- Complete overhaul of original Note Mark project.

## [0.5.0] - 2022-07-15
### Changed
- Updated pip packages
- Updated theme changer to V2

### Fixed
- Icon centred in buttons

## [0.4.0] - 2021-12-31
### Added
- Add admin export functionality
- Site icon
- Iconify interface

### Changed
- Reduce size of docker image by using multi-stage build
- Update pip packages
- Target python 3.10
- Use web_health_checker package for is-healthy route
- Refactor code
- Alter way app is run
- Use theme-changer library for theme adjustment

### Fixed
- Minor style improvements

## [0.3.1.1] - 2021-08-22
### Changed
- Increment pip version
- Adjust README content

## [0.3.1] - 2021-05-20
### Changed
- Allow for minor pip version updates

### Fixed
- Remove "saved" popup to just use the save button for status

## [0.3.0] - 2021-04-26
### Added
- Show whether note is unsaved (change to unsaved when user types, change to save when save is completed)
- Sort row results
    - Notebook list page
    - Notes list page
- Add more admin commands
    - Reset password
    - Delete user
    - View users
- Export notebook (downloads as zip file)
- Remove unneeded features
- Add share-link copy button
- Option to remove link-shares & user-shares

### Fixed
- Correct unreadable link font colour in dark-mode

## [0.2.0] - 2021-04-15
### Added
- add dark & light theme
- add admin stats & user password change
- add account deletion
- add username & password change functionality
- support saving with link-share

## [0.1.1] - 2021-04-07
### Fixed
- Change PATCH to POST route

## [0.1.0] - 2021-04-05
### Added
- Remember me tick box on login
- API routes (only available to logged in users)
- use fetch for getting the notebook html
- Create a get_token route
- Show ws message for when edited from elsewhere
- Fix the share-link edit route (mark updated functions needs changing)
- Popup messages match Quart flashes
- Auto delete flashes after a certain time
- Share-link can trigger ws messages, but not receive them
- Mobile view
- Control panel on top of text area
- Change websocket ws to wss if page is secure
- Background saving & auto-save (no page reload needed)
- Make flashed messages float at top of window
- Make tool-bar float at top when it is out of view

### Fixed
- Fix bug with saving in edit after already doing so
