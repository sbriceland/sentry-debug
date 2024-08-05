PORT=${PORT:=3000}

# invoke (in parallel) a bunch of different requests containing valid authorization header
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 4" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 4" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 4" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 4" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 2" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 3" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users &
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users &
wait
