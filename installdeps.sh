#!/bin/bash
# Installation only, only use this once

# Abort if run as root
if [ $(id -u) -eq 0 ]
then
	echo "This script mustn't be run as root. Aborting."
	exit 1
fi

set -xe

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Debian-based distros
if type "apt-get" > /dev/null; then
	sudo apt-get update
	sudo apt-get -y install nodejs-legacy tmux
fi

# Arch-based distros
if type "pacman" > /dev/null; then
	sudo pacman -Sy nodejs tmux --noconfirm
fi

# Global NPM dependencies
npm config set python /usr/bin/python2
if ! type "bower" > /dev/null; then sudo npm install -g bower ; fi
if ! type "http-server" > /dev/null; then sudo npm install -g http-server ; fi
if ! type "node-gyp" > /dev/null; then sudo npm install -g node-gyp ; fi
if ! type "nodemon" > /dev/null; then sudo npm install -g nodemon ; fi
if ! type "nw" > /dev/null; then sudo npm install -g nw ; fi

# Install server dependencies
( cd $CWD/server/api ; sudo npm install )
( cd $CWD/server/webcam ; sudo npm install )

# Install client dependencies
( cd $CWD/client/adminpanel/site ; bower install )
( cd $CWD/client/app/www ; bower install )
( cd $CWD/client/entrycheck/site ; bower install )
( cd $CWD/client/registration/site ; bower install )
( cd $CWD/client/userterminal/site ; bower install )
( cd $CWD/client/genrequest/site ; bower install )

# Workaround for missing libudev.so.0 on most systems, for nodewebkit
if [ ! -f /lib/x86_64-linux-gnu/libudev.so.0 ] && [ ! -f /lib/libudev.so.0 ]; then
	# Most debian-based systems
	if [ -f /lib/x86_64-linux-gnu/libudev.so.1 ]; then
		sudo ln -s /lib/x86_64-linux-gnu/libudev.so.1 /lib/x86_64-linux-gnu/libudev.so.0
	fi

	# Some other systems, like Archlinux
	if [ -f /lib/libudev.so.1 ]; then
		sudo ln -s /lib/libudev.so.1 /lib/libudev.so.0
	fi
fi