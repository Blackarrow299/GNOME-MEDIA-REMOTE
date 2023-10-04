## About
This project is a monorepo that combines a Node.js server with a React Native mobile app. It allows users to remotely control media playback on a GNOME desktop environment using their mobile devices.The Node.js server connects to the desktop via D-Bus and exposes an API for controlling media functions such as play, pause, volume adjustment.

## Usage
### Installation

1. Clone this repository:

  ```bash
  git clone https://github.com/Blackarrow299/media_sync.git
```

2. Navigate to the project directory:

  ```bash
  cd media_sync
```
3. Install dependencies
```bash
yarn install
```
### Building and Running
Build the app:
```bash
yarn turbo build
```
Run the development server:
```bash
yarn turbo dev
```

### License
This project is licensed under the MIT License. See the LICENSE file for details.
