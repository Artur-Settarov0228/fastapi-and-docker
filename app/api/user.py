from fastapi import APIRouter

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"]
)

@router.get("/")
def get_users():
    return ["user1", "user2"]

@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}