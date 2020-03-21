
SET INPUT_TARGET_ORG=dehub_ma
SET INPUT_SOURCE_DIRECTORY=es-base-objects
SET INPUT_PROJECT_DIRECTORY=C:\Projects\easy-spaces-lwc
SET INPUT_WAIT_TIME=60
SET INPUT_CHECKONLY=true
SET INPUT_TESTLEVEL=RunLocalTests
SET INPUT_VALIDATION_IGNORE=C:\Projects\easy-spaces-lwc\.forceignore
SET INPUT_ISTOBREAKBUILDIFEMPTY=true







ts-node --project  ..\..\BuildTasks\DeploySourceToOrgTask\tsconfig.json  ..\..\BuildTasks\DeploySourceToOrgTask\DeploySourceToOrg

