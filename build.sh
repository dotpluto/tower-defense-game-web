#options
shopt -s nullglob #if glob doesn't match anything return nothing

#sourcing environment variables
if [ -e ./.env ]; then
	source ./.env
else
	echo "You do not have a .env file set up for this environment. Aborting."
	exit 1
fi

if [ -z ${DEV_WEBROOT} ]; then
	echo "DEV_WEBROOT is not set. Aborting."
	exit 1
fi

if [ ! -d ${DEV_WEBROOT} ]; then
	echo "DEV_WEBROOT is not a valid dir. Aborting."
	exit 1
fi

#clean webroot
cleanup_list=${DEV_WEBROOT}*
if [ -n ${cleanup_list:+"notempty"} ]; then
	rm -r $cleanup_list
fi

#individual files
cp ./*.html ${DEV_WEBROOT}
cp ./*.css ${DEV_WEBROOT}

#folders
cp -r ./assets/ ${DEV_WEBROOT}

tsc --outDir ${DEV_WEBROOT}
