using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Budgex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HashRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Token",
                table: "RefreshTokens",
                newName: "TokenHash");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                newName: "IX_RefreshTokens_TokenHash");

            // De befintliga raderna innehåller tokens i klartext. De matchar
            // aldrig ett avtryck och kan alltså inte användas ändå — men de
            // ska inte ligga kvar. Alla får logga in en gång till.
            migrationBuilder.Sql(@"DELETE FROM ""RefreshTokens"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TokenHash",
                table: "RefreshTokens",
                newName: "Token");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                newName: "IX_RefreshTokens_Token");
        }
    }
}
