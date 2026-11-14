using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Budgex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TreatExistingEmailsAsConfirmed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Kontona skapades innan e-postverifiering fanns och har aldrig fått
            // något mejl. De ska inte låsas ute när verifieringen slås på (ADR 0007).
            migrationBuilder.Sql(
                """
                UPDATE "AspNetUsers" SET "EmailConfirmed" = true WHERE NOT "EmailConfirmed";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Går inte att vända: efteråt syns inte vilka konton som var obekräftade.
        }
    }
}
