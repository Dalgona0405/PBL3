using FluentValidation;
using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Validators
{
    public class CreateJobDTOValidator : AbstractValidator<CreateJobDTO>
    {
        public CreateJobDTOValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Vui lòng nhập tiêu đề công việc.")
                .MaximumLength(200).WithMessage("Tiêu đề công việc tối đa 200 ký tự.");

            RuleFor(x => x.LocationId)
                .GreaterThan(0).WithMessage("Vui lòng chọn địa điểm làm việc hợp lệ.");

            RuleFor(x => x.SalaryMin)
                .InclusiveBetween(0, 999).When(x => x.SalaryMin.HasValue)
                .WithMessage("Mức lương tối thiểu phải trong khoảng từ 0 đến 999.");

            RuleFor(x => x.SalaryMax)
                .InclusiveBetween(0, 999).When(x => x.SalaryMax.HasValue)
                .WithMessage("Mức lương tối đa phải trong khoảng từ 0 đến 999.");

            RuleFor(x => x)
                .Must(x => !x.SalaryMin.HasValue || !x.SalaryMax.HasValue || x.SalaryMax >= x.SalaryMin)
                .WithMessage("Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.");
        }
    }

    public class UpdateJobDTOValidator : AbstractValidator<UpdateJobDTO>
    {
        public UpdateJobDTOValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().When(x => x.Title != null)
                .MaximumLength(200).WithMessage("Tiêu đề công việc tối đa 200 ký tự.");

            RuleFor(x => x.LocationId)
                .GreaterThan(0).When(x => x.LocationId.HasValue)
                .WithMessage("Mã địa điểm làm việc không hợp lệ.");

            RuleFor(x => x.SalaryMin)
                .InclusiveBetween(0, 999).When(x => x.SalaryMin.HasValue)
                .WithMessage("Mức lương tối thiểu phải trong khoảng từ 0 đến 999.");

            RuleFor(x => x.SalaryMax)
                .InclusiveBetween(0, 999).When(x => x.SalaryMax.HasValue)
                .WithMessage("Mức lương tối đa phải trong khoảng từ 0 đến 999.");

            RuleFor(x => x)
                .Must(x => !x.SalaryMin.HasValue || !x.SalaryMax.HasValue || x.SalaryMax >= x.SalaryMin)
                .WithMessage("Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.");

            RuleFor(x => x.Status)
                .Must(s => !s.HasValue || s == 0 || s == 1)
                .WithMessage("Trạng thái việc làm chỉ chấp nhận 0 (Đóng) hoặc 1 (Đang tuyển).");
        }
    }
}
