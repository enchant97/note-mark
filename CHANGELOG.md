# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
