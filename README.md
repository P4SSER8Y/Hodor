# Hodor

HOLD THE DOOOOOOOOOOOOOR

## Environment Variables

| Key              | Default | Description                                                               |
| ---------------- | ------- | ------------------------------------------------------------------------- |
| RP_NAME          | ` `     | RP Name of WebAuthn                                                       |

## Notes

### Register

```mermaid
sequenceDiagram

actor Reader
participant Device
participant Portal
box Winterfall
participant Brandon
participant Secretary
end


Reader ->> Portal: GET(name)
Portal ->> Brandon: GET(name)

activate Brandon
Brandon ->> Secretary: QUERY(registrable?)
activate Secretary
Secretary ->> Brandon: [registrable]
deactivate Secretary
Brandon ->> Secretary: Query(id)
activate Secretary
Secretary -->> Brandon: [id]
deactivate Secretary
Note over Brandon: generate<br>challenge
Brandon ->> Secretary: Insert(challenge)
activate Secretary
deactivate Secretary
Brandon -->> Portal: [id, challenge]
deactivate Brandon

Portal ->> Device: Request(id, challenge)
activate Device
Device ->> Reader: Confirm?
Reader -->> Device: Confirmed
Device -->> Portal: [response]
deactivate Device

Portal ->> Brandon: POST(name, response, baggage)
activate Brandon
Brandon ->> Secretary: Query(challenge)
activate Secretary
Secretary -->> Brandon: [challenge]
deactivate Secretary
Note over Brandon: verify
Brandon ->> Secretary: Insert(id, publicKey)
activate Secretary
deactivate Secretary
Brandon ->> Secretary: Insert(baggage)
activate Secretary
deactivate Secretary
Brandon -->> Portal: [200]
deactivate Brandon

Portal -->> Reader: [200]
```

### Authorization

```mermaid
sequenceDiagram

actor Reader
participant Device
participant Portal
box Winterfall
participant Hodor
participant Secretary
participant Meera
end

Reader ->> Portal: GET(name, Callback)

Portal ->> Hodor: GET(name)
activate Hodor
Hodor ->> Secretary: Query(id)
activate Secretary
Secretary -->> Hodor: [id]
deactivate Secretary
Note over Hodor: generate<br>challenge
Hodor ->> Secretary: Insert(challenge)
activate Secretary
deactivate Secretary
Hodor -->> Portal: [id, challenge]
deactivate Hodor

Portal ->> Device: Request[id, challenge]
activate Device
Device ->> Reader: Confirm?
Reader -->> Device: Confirmed
Device -->> Portal: [response]
deactivate Device

Portal ->> Hodor: POST(name, response)
activate Hodor
Hodor ->> Secretary: Query(challenge)
activate Secretary
Secretary -->> Hodor: [challenge]
deactivate Secretary
Hodor ->> Secretary: Query(id, publicKey, baggage)
activate Secretary
Secretary -->> Hodor: [id, publicKey, baggage]
deactivate Secretary

Note over Hodor: verify

Hodor ->> Meera: Packup(baggage)
activate Meera
Meera -->> Hodor: [signedBaggage]
deactivate Meera

Hodor -->> Portal: [signedBaggage]
deactivate Hodor

Portal ->> Reader: Callback(name, signedBaggage)
```
