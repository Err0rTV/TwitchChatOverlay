#!/bin/bash

projectname=TwitchChatOverlay
version=`git describe --tags`

archivefilename=${projectname}-${version}

echo ${archivefilename}

if [ ! -d build ]; then mkdir build; fi

cd src
if [ -f ../build/${archivefilename}.zip ]; then rm ../build/${archivefilename}.zip; fi
zip ../build/${archivefilename}.zip *
cd ..
