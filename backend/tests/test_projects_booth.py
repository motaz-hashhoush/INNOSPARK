"""Student Projects vs Virtual Booth: creation permissions, publishing, visibility, contact."""
import pytest
from fastapi.testclient import TestClient

from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole
from app.utils.security import get_password_hash


@pytest.fixture(autouse=True)
def no_background_work(monkeypatch):
    """Background tasks run inline under TestClient — keep the model/LLM/SMTP out."""
    monkeypatch.setattr("app.routers.projects.embed_project_bg", lambda *a, **k: None)
    monkeypatch.setattr("app.routers.projects.generate_bilingual_descriptions", lambda *a, **k: None)
    monkeypatch.setattr("app.routers.projects.send_email", lambda *a, **k: True)


def _register(client, role, email, name):
    r = client.post("/api/auth/register", json={
        "email": email, "password": "secret123", "full_name": name, "role": role,
    })
    assert r.status_code == 201, r.text
    return r.json()


def _login(client, email):
    r = client.post("/api/auth/login", json={"email": email, "password": "secret123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def users(client, db_session):
    sup = _register(client, "supervisor", "sup@najah.edu", "Dr. Sup")
    other = _register(client, "supervisor", "other@najah.edu", "Dr. Other")
    student = _register(client, "student", "stu@najah.edu", "Stu")
    admin = User(email="admin@najah.edu", password_hash=get_password_hash("secret123"),
                 full_name="Admin", role=UserRole.ADMIN)
    db_session.add(admin)
    db_session.commit()
    return {
        "sup": (sup["id"], _login(client, "sup@najah.edu")),
        "other": (other["id"], _login(client, "other@najah.edu")),
        "student": (student["id"], _login(client, "stu@najah.edu")),
        "admin": (admin.id, _login(client, "admin@najah.edu")),
    }


def _create(client, headers, **over):
    payload = {"title": "Solar dryer", "problem": "Crops rot after harvest", "summary": "A solar dryer"}
    payload.update(over)
    r = client.post("/api/projects", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_supervisor_create_autoassigns_and_approves(client: TestClient, users):
    sup_id, sup = users["sup"]
    p = _create(client, sup, supervisor_id=999)  # ignored for supervisors
    assert p["supervisor_id"] == sup_id
    assert p["approval_status"] == "approved"
    assert p["booth_published"] is False
    assert p["supervisor"]["full_name"] == "Dr. Sup"


def test_student_cannot_create(client: TestClient, users):
    _, stu = users["student"]
    r = client.post("/api/projects", json={"title": "x", "problem": "y"}, headers=stu)
    assert r.status_code == 403


def test_publish_auto_approves_and_booth_filter(client: TestClient, db_session, users):
    sup_id, sup = users["sup"]
    _, admin = users["admin"]
    p1 = _create(client, admin, supervisor_id=sup_id)  # pending, admin-created
    p2 = _create(client, admin, title="Other", supervisor_id=sup_id)
    assert p1["approval_status"] == "pending"

    r = client.put(f"/api/projects/{p1['id']}/booth", json={"published": True}, headers=sup)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["booth_published"] is True
    assert body["booth_published_at"] is not None
    assert body["approval_status"] == "approved"
    assert body["reviewed_by"] == sup_id

    # Anonymous booth view: only the published one
    booth = client.get("/api/projects", params={"booth": "true"}).json()
    assert [p["id"] for p in booth["projects"]] == [p1["id"]]
    # Anonymous full list: pending p2 is hidden
    ids = [p["id"] for p in client.get("/api/projects").json()["projects"]]
    assert p1["id"] in ids and p2["id"] not in ids
    # Staff can list "not in booth"
    not_booth = client.get("/api/projects", params={"booth": "false"}, headers=admin).json()
    assert [p["id"] for p in not_booth["projects"]] == [p2["id"]]

    # Notifications went to the supervisor
    n = db_session.query(Notification).filter(
        Notification.type == NotificationType.PROJECT_PUBLISHED, Notification.user_id == sup_id
    ).count()
    assert n == 1

    # Re-publish is idempotent (no second notification); unpublish keeps approval
    client.put(f"/api/projects/{p1['id']}/booth", json={"published": True}, headers=sup)
    assert db_session.query(Notification).filter(
        Notification.type == NotificationType.PROJECT_PUBLISHED, Notification.user_id == sup_id
    ).count() == 1
    r = client.put(f"/api/projects/{p1['id']}/booth", json={"published": False}, headers=sup)
    assert r.json()["booth_published"] is False
    assert r.json()["approval_status"] == "approved"
    assert client.get("/api/projects", params={"booth": "true"}).json()["total"] == 0


def test_publish_forbidden_for_others(client: TestClient, users):
    sup_id, sup = users["sup"]
    _, other = users["other"]
    _, stu = users["student"]
    p = _create(client, sup)
    assert client.put(f"/api/projects/{p['id']}/booth", json={"published": True}, headers=other).status_code == 403
    assert client.put(f"/api/projects/{p['id']}/booth", json={"published": True}, headers=stu).status_code == 403
    assert client.put(f"/api/projects/{p['id']}/booth", json={"published": True}).status_code == 401


def test_reject_unpublishes(client: TestClient, users):
    _, sup = users["sup"]
    _, admin = users["admin"]
    p = _create(client, sup)
    client.put(f"/api/projects/{p['id']}/booth", json={"published": True}, headers=sup)
    r = client.put(f"/api/projects/{p['id']}/review", json={"approved": False, "note": "no"}, headers=admin)
    assert r.status_code == 200
    assert r.json()["booth_published"] is False
    assert r.json()["approval_status"] == "rejected"


def test_contact_notifies_supervisor_and_admin(client: TestClient, db_session, users):
    sup_id, sup = users["sup"]
    admin_id, _ = users["admin"]
    p = _create(client, sup)
    form = {"name": "Acme Co", "email": "buyer@acme.com", "organization": "Acme",
            "message": "We would like to pilot this dryer on our farms."}

    # Not published yet → 404
    assert client.post(f"/api/projects/{p['id']}/contact", json=form).status_code == 404

    client.put(f"/api/projects/{p['id']}/booth", json={"published": True}, headers=sup)
    r = client.post(f"/api/projects/{p['id']}/contact", json=form)
    assert r.status_code == 200, r.text
    assert "contact_email" in r.json()

    q = db_session.query(Notification).filter(Notification.type == NotificationType.CONTACT_REQUEST)
    assert q.filter(Notification.user_id == sup_id).count() == 1
    assert q.filter(Notification.user_id == admin_id).count() == 1
    assert "Acme Co" in q.first().message

    assert client.post(f"/api/projects/{p['id']}/contact", json={**form, "email": "nope"}).status_code == 422


def test_users_endpoint_admin_only(client: TestClient, users):
    _, sup = users["sup"]
    _, admin = users["admin"]
    assert client.get("/api/auth/users").status_code == 401
    assert client.get("/api/auth/users", headers=sup).status_code == 403
    r = client.get("/api/auth/users", params={"role": "supervisor"}, headers=admin)
    assert r.status_code == 200
    names = {u["full_name"] for u in r.json()}
    assert names == {"Dr. Sup", "Dr. Other"}
    assert "password_hash" not in r.json()[0]


def test_upload_sets_cover_and_file_url(client: TestClient, users, monkeypatch, tmp_path):
    monkeypatch.setattr("app.services.file_service.settings.UPLOAD_DIR", str(tmp_path))
    _, sup = users["sup"]
    _, other = users["other"]
    p = _create(client, sup)

    r = client.post(f"/api/projects/{p['id']}/files", headers=sup,
                    files=[("files", ("cover.png", b"\x89PNG\r\n", "image/png")),
                           ("files", ("deck.pdf", b"%PDF-1.4", "application/pdf"))])
    assert r.status_code == 201, r.text
    files = r.json()
    assert files[0]["url"].startswith(f"/uploads/{p['id']}/") and files[0]["url"].endswith(".png")

    detail = client.get(f"/api/projects/{p['id']}").json()
    assert detail["image_url"] == files[0]["url"]
    assert {f["file_type"] for f in detail["files"]} == {"image", "document"}

    # Another supervisor can neither upload nor delete
    assert client.post(f"/api/projects/{p['id']}/files", headers=other,
                       files=[("files", ("x.png", b"x", "image/png"))]).status_code == 403
    assert client.delete(f"/api/projects/{p['id']}/files/{files[0]['id']}", headers=other).status_code == 403

    # Deleting the cover file clears image_url
    assert client.delete(f"/api/projects/{p['id']}/files/{files[0]['id']}", headers=sup).status_code == 204
    detail = client.get(f"/api/projects/{p['id']}").json()
    assert detail["image_url"] is None
    assert len(detail["files"]) == 1
