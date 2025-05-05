export class CreateAdminDto {
  firebaseUid: string;
  email: string;
  name: string;
}

export class UpdateAdminDto {
  email?: string;
  name?: string;
}
