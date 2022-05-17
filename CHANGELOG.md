# Changelog

## `1.0.1 Beta`

- Remove Orbit
- Orderbook contract integration

## `1.0.0-0 Beta`

- Initial Beta Release
- UI refresh
  - Faster pages
  - Better overviewing experience for collectibles
  - Include the Orbit protocol explorer in the UI
  - Verto ID
  - Collections
  - ArConnect support
- Invite system
- Library refactor
- Caching

## `1.0.0-1 Beta`

- Allow minting new collectibles on Verto
- Layout fixes
- Price details in the swap page
- Make setup modal username fields more obvious
- Verify usernames in setup modal
- Warn users about tx mining delay for Verto ID to save
- Fix space erroring on not found tokens
- Add changelogs
- Full beta release to the public
- Refactor workspace

## `1.0.0-2 Beta`

- Support markdown descriptions for collectibles and bios
- Fixup ID setup not updating addresses
- Fixup collection contract owner bug
- Fix error on swap when the initial token does not have a price
- Fix 404 errors incorrectly displayed on Orbit
- Custom 500 error page

## `1.5.0 Beta`

- Inteface

  - Refactored
    - Exchange
      - CLOB infrastructures
      - Swap UX
        - More error messages
        - Params
    - UI
      - Swap layout
      - Art / Collectible layout
      - Minor PSC UI changes
      - Landing refactor
      - Mobile
        - Navbar refactor
        - Better responsive layout
      - Search refactor
      - Use Ashlar's Cryptometa API as the primary source of token logos
      - Dark mode changes
      - Blur styles for navbar
      - New Footer
      - Minor component updates & fixes
    - Cache refactor:
      - New cache interface
      - Deeper cache integration
      - Speedier loading
    - Added comments to the codebase
    - FCP chechks
    - Infinite loading on pages
    - Testnet
    - ArConnect integration improvements
    - NextJS server side functions
  - Removed: - Orbit - Balance history (bugged, will be added back later)
    <br />

- Verto JS library

  - Complete refactor
    - Implemented CLOB Contract based exchange
    - Implemented new cache interface
    - Deprecated trading posts
    - Separated functionalities into subcategories
    - Optional cache usage (enabled by default)
    - Use 3em for contract evaluation
    - Browser and Node modes
  - Added functions
    - Exchange
      - Adding pairs
      - Orderbook / order functions
      - Order estimate calculation
    - Token:
      - Token type fetching
      - Listing tokens
      - Flexible logo API using Cryptometa
  - Updated to use the new CLOB infrastructure - Swap function - Cancel function - Order functionalities
    <br />

- Contracts
  - CLOB
    - Replaces trading posts
    - Advanced Orderbook management
    - FCP support
  - Collectible
    - FCP support
