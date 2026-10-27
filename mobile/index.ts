// The background GPS task has to be defined at module scope, before the router
// mounts anything — iOS can relaunch the app headless to deliver locations.
import "./lib/locationTask";
import "expo-router/entry";
