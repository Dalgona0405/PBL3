using FluentValidation;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;

namespace JobSeekingAPI.Validators
{
    public class LoginDTOValidator : AbstractValidator<LoginDTO>
    {
        public LoginDTOValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Vui lòng nhập email.")
                .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Vui lòng nhập mật khẩu.");
        }
    }

    public class CreateUserDTOValidator : AbstractValidator<CreateUserDTO>
    {
        private static readonly string[] AllowedRoles = { UserRoles.Candidate, UserRoles.Recruiter, UserRoles.Company };

        public CreateUserDTOValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Vui lòng nhập email.")
                .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Vui lòng nhập mật khẩu.")
                .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự.");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Vui lòng nhập họ và tên.")
                .MaximumLength(100).WithMessage("Họ và tên không vượt quá 100 ký tự.");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Vui lòng chọn vai trò.")
                .Must(role => AllowedRoles.Contains(role))
                .WithMessage("Vai trò chỉ chấp nhận Candidate, Recruiter hoặc Company.");
        }
    }

    public class GoogleLoginDTOValidator : AbstractValidator<GoogleLoginDTO>
    {
        private static readonly string[] AllowedRoles = { UserRoles.Candidate, UserRoles.Recruiter, UserRoles.Company };

        public GoogleLoginDTOValidator()
        {
            RuleFor(x => x.IdToken)
                .NotEmpty().WithMessage("Google ID Token không được để trống.");

            RuleFor(x => x.Role)
                .Must(role => string.IsNullOrEmpty(role) || AllowedRoles.Contains(role))
                .WithMessage("Vai trò chỉ chấp nhận Candidate, Recruiter hoặc Company.");
        }
    }

    public class ChangePasswordDTOValidator : AbstractValidator<ChangePasswordDTO>
    {
        public ChangePasswordDTOValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Vui lòng nhập mật khẩu hiện tại.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới.")
                .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage("Vui lòng xác nhận mật khẩu mới.")
                .Equal(x => x.NewPassword).WithMessage("Mật khẩu xác nhận không khớp với mật khẩu mới.");
        }
    }
}
