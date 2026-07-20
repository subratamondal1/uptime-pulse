import httpx
import pytest

from src.monitors import router as router_module


@pytest.fixture(autouse=True)
def _mock_ping_up(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_ping(client: httpx.AsyncClient, url: str) -> tuple[int, float, bool]:
        return 200, 42.0, True

    monkeypatch.setattr(router_module, "ping_once", fake_ping)


async def test_healthz(client: httpx.AsyncClient) -> None:
    response = await client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_create_monitor_up(client: httpx.AsyncClient) -> None:
    response = await client.post("/monitors", json={"url": "https://example.com"})
    assert response.status_code == 201
    body = response.json()
    assert body["latest_check"]["is_up"] is True
    assert body["latest_check"]["status_code"] == 200


async def test_create_monitor_down(
    client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_ping_down(client: httpx.AsyncClient, url: str) -> tuple[None, float, bool]:
        return None, 10.0, False

    monkeypatch.setattr(router_module, "ping_once", fake_ping_down)
    response = await client.post("/monitors", json={"url": "https://down.example.com"})
    assert response.status_code == 201
    assert response.json()["latest_check"]["is_up"] is False


async def test_duplicate_monitor_conflict(client: httpx.AsyncClient) -> None:
    await client.post("/monitors", json={"url": "https://dup.example.com"})
    response = await client.post("/monitors", json={"url": "https://dup.example.com"})
    assert response.status_code == 409


async def test_list_monitors(client: httpx.AsyncClient) -> None:
    await client.post("/monitors", json={"url": "https://list-test.example.com"})
    response = await client.get("/monitors")
    assert response.status_code == 200
    urls = [m["url"] for m in response.json()]
    assert "https://list-test.example.com/" in urls


async def test_checks_endpoint(client: httpx.AsyncClient) -> None:
    create = await client.post("/monitors", json={"url": "https://checks-test.example.com"})
    monitor_id = create.json()["id"]
    response = await client.get(f"/monitors/{monitor_id}/checks")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_checks_unknown_monitor_404(client: httpx.AsyncClient) -> None:
    response = await client.get("/monitors/does-not-exist/checks")
    assert response.status_code == 404


async def test_delete_monitor(client: httpx.AsyncClient) -> None:
    create = await client.post("/monitors", json={"url": "https://delete-test.example.com"})
    monitor_id = create.json()["id"]
    response = await client.delete(f"/monitors/{monitor_id}")
    assert response.status_code == 204
    response = await client.delete(f"/monitors/{monitor_id}")
    assert response.status_code == 404
