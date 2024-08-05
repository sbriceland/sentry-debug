PORT=${PORT:=3000}

# send an "authenticated" request
curl --header "authorization: 1" --header "content-type: application/json" http://localhost:$PORT/api/users
# send a request with "bad auth"
curl --header "authorization: 7870870987" --header "content-type: application/json" http://localhost:$PORT/api/users
